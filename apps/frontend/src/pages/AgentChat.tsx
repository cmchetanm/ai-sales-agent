import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, IconButton, Stack, TextField, Typography, LinearProgress, Chip, Box, MenuItem, Select, FormControl, InputLabel, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ClearIcon from '@mui/icons-material/Clear';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { ChatBubble } from '../components/ChatBubble';
import { ScrollToBottom } from '../components/ScrollToBottom';
import { createCable } from '../lib/cable';

type ChatMsg = { id?: number; role: 'user' | 'assistant'; content: string; sent_at?: string };

export const AgentChat = () => {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessions, setSessions] = useState<{id:number; status:string}[]>([]);
  const [apolloMode, setApolloMode] = useState<'live'|'sample'|'unauthorized'|'unknown'>('unknown');
  const [apolloHint, setApolloHint] = useState<string | undefined>(undefined);
  const [sessionStatus, setSessionStatus] = useState<string>('active');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);
  const { t } = useTranslation();
  // ActionCable consumer
  const cableRef = useRef<ReturnType<typeof createCable> | null>(null);
  const subRef = useRef<any>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setShowScroll(!nearBottom);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Load existing session if present; otherwise create a new one
  useEffect(() => {
    const init = async () => {
      if (!token) return;
      // Resolve Apollo status with fallback paths
      let mode: 'live'|'sample'|'unauthorized'|'unknown' = 'unknown';
      let hint: string | undefined = undefined;
      try {
        const st = await api.apolloStatus(token);
        if (st.ok && st.data) {
          mode = st.data.apollo.mode; hint = st.data.apollo.probe?.hint;
        }
      } catch {}
      if (mode === 'unknown') {
        try {
          const st2 = await api.apolloStatusSimple(token);
          if (st2.ok && st2.data) { mode = st2.data.mode as any; }
        } catch {}
      }
      setApolloMode(mode);
      setApolloHint(hint);

      const list = await api.chatSessionsIndex(token);
      if (list.ok && list.data) setSessions(list.data.chat_sessions || []);
      const stored = Number(localStorage.getItem('last_chat_session_id') || '');
      if (stored && !Number.isNaN(stored)) {
        const show = await api.chatSessionShow(token, stored);
        if (show.ok && show.data) {
          setSessionId(show.data.chat_session.id);
          const msgs = (show.data.chat_session.messages || []) as ChatMsg[];
          setMessages(msgs);
          // Inferred status when resuming
          setSessionStatus(show.data.chat_session.status || 'active');
          return;
        }
      }
      const res = await api.chatSessionCreate(token);
      if (res.ok && res.data) { setSessionId(res.data.chat_session.id); setSessionStatus('active'); }
    };
    init();
    // Retry status once if still unknown
    const t = setTimeout(() => {
      if (apolloMode === 'unknown' && token) {
        api.apolloStatus(token).then((st) => {
          if (st.ok && st.data) setApolloMode(st.data.apollo.mode);
        }).catch(() => {});
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [token]);

  // Subscribe to ActionCable updates for this chat session
  useEffect(() => {
    if (!token || !sessionId) return;
    // Ensure connection
    if (!cableRef.current) cableRef.current = createCable();
    // Subscribe
    subRef.current = cableRef.current.subscriptions.create(
      { channel: 'ChatSessionChannel', id: sessionId },
      {
        received: (data: any) => {
          if (data?.event === 'message.created' && data.message) {
            setMessages((prev) => {
              const exists = prev.some((m) => m.id === data.message.id);
              return exists ? prev : [...prev, data.message as ChatMsg];
            });
            // Stop typing indicator once message arrives
            setRemoteTyping(false);
          }
          if (data?.event === 'typing' && data?.actor === 'assistant') {
            setRemoteTyping(data?.status === 'start');
          }
        }
      }
    );
    return () => {
      try { if (subRef.current) subRef.current.unsubscribe(); } catch {}
      subRef.current = null;
    };
  }, [token, sessionId]);

  // Persist last session id locally to allow resuming chats
  useEffect(() => {
    if (sessionId) localStorage.setItem('last_chat_session_id', String(sessionId));
  }, [sessionId]);

  const send = async () => {
    if (!token || !sessionId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    const res = await api.chatMessagesCreate(token, sessionId, content);
    setSending(false);
    // Avoid local echo; let cable push messages. As a safety net fetch latest once.
    try {
      const refreshed = await api.chatMessagesIndex(token, sessionId);
      if (refreshed.ok && refreshed.data) {
        setMessages((refreshed.data.messages || []) as ChatMsg[]);
      }
    } catch {}
  };

  const refreshSessions = async () => {
    if (!token) return;
    const list = await api.chatSessionsIndex(token);
    if (list.ok && list.data) setSessions(list.data.chat_sessions || []);
    if (sessionId) {
      const show = await api.chatSessionShow(token, sessionId);
      if (show.ok && show.data) setSessionStatus(show.data.chat_session.status || sessionStatus);
    }
  };

  const pauseSession = async () => {
    if (!token || !sessionId) return;
    const res = await api.chatSessionPause(token, sessionId);
    if (res.ok && res.data) { setSessionStatus(res.data.chat_session.status); refreshSessions(); }
  };
  const resumeSession = async () => {
    if (!token || !sessionId) return;
    const res = await api.chatSessionResume(token, sessionId);
    if (res.ok && res.data) { setSessionStatus(res.data.chat_session.status); refreshSessions(); }
  };
  const completeSession = async () => {
    if (!token || !sessionId) return;
    const res = await api.chatSessionComplete(token, sessionId);
    if (res.ok && res.data) { setSessionStatus(res.data.chat_session.status); refreshSessions(); }
  };

  const createSession = async () => {
    if (!token) return;
    const res = await api.chatSessionCreate(token);
    if (res.ok && res.data) {
      setSessionId(res.data.chat_session.id);
      setMessages([]);
      const list = await api.chatSessionsIndex(token); if (list.ok && list.data) setSessions(list.data.chat_sessions || []);
    }
  };

  const loadSession = async (id: number) => {
    if (!token) return;
    const show = await api.chatSessionShow(token, id);
    if (show.ok && show.data) {
      setSessionId(show.data.chat_session.id);
      setMessages((show.data.chat_session.messages || []) as ChatMsg[]);
      localStorage.setItem('last_chat_session_id', String(id));
    }
  };

  const assistantText = (messages[messages.length-1]?.role === 'assistant') ? messages[messages.length-1]?.content || '' : '';
  const showYN = /satisfied/i.test(assistantText);
  const showIndustryHints = /Which industries/i.test(assistantText);
  const showRoleHints = /Which roles/i.test(assistantText);
  const showLocationHints = /locations|countries/i.test(assistantText);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h5" fontWeight={800}>{t('chat.title')}</Typography>
        <Chip size="small" color={apolloMode === 'live' ? 'success' : apolloMode === 'unauthorized' ? 'error' : (apolloMode === 'sample' ? 'default' : 'warning')} label={`Apollo: ${apolloMode === 'unknown' ? 'checking' : apolloMode}${apolloHint ? ` (${apolloHint})` : ''}`} />
        <Chip size="small" label={`Session: ${sessionStatus}`} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="session-select">Session</InputLabel>
          <Select labelId="session-select" label="Session" value={sessionId || ''}
            onChange={(e) => { const id = Number(e.target.value); if (!Number.isNaN(id)) loadSession(id); }}>
            {sessions.map((s) => (
              <MenuItem key={s.id} value={s.id}>#{s.id} — {s.status}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Tooltip title="Start a new chat session">
          <Chip label="New Session" color="primary" onClick={createSession} />
        </Tooltip>
        <Tooltip title="Pause this chat">
          <span>
            <Chip label="Pause" onClick={pauseSession} disabled={!sessionId || sessionStatus !== 'active'} />
          </span>
        </Tooltip>
        <Tooltip title="Resume this chat">
          <span>
            <Chip label="Resume" onClick={resumeSession} disabled={!sessionId || sessionStatus !== 'paused'} />
          </span>
        </Tooltip>
        <Tooltip title="Complete this chat">
          <span>
            <Chip label="Complete" color="success" onClick={completeSession} disabled={!sessionId || sessionStatus === 'completed'} />
          </span>
        </Tooltip>
      </Stack>
      <Card className="glass" sx={{ position: 'relative' }}>
        {sending && <LinearProgress color="secondary" />}
        <CardContent>
          <div ref={listRef} style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} timestamp={m.sent_at} />
            ))}
            {(sending || remoteTyping) && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div className="typing" data-testid="typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </CardContent>
        <ScrollToBottom visible={showScroll} onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      </Card>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {showYN && (
          <>
            <Chip color="success" label="Yes" size="small" onClick={() => setInput((prev) => prev || 'yes')} />
            <Chip color="warning" label="No, fetch more" size="small" onClick={() => setInput((prev) => prev || 'no, fetch more')} />
          </>
        )}
        {showIndustryHints && ['IT','Healthcare','Finance','SaaS'].map((hint) => (
          <Chip key={hint} label={hint} size="small" onClick={() => setInput((prev) => prev || hint)} />
        ))}
        {showRoleHints && ['CTO','VP Engineering','Head of Engineering'].map((hint) => (
          <Chip key={hint} label={hint} size="small" onClick={() => setInput((prev) => prev || `Role: ${hint}`)} />
        ))}
        {showLocationHints && ['US','EU','India'].map((hint) => (
          <Chip key={hint} label={hint} size="small" onClick={() => setInput((prev) => prev || hint)} />
        ))}
        {!showYN && !showIndustryHints && !showRoleHints && !showLocationHints && ['Target CTOs in US','Add AI keywords','Location: EU','Role: Marketing'].map((hint) => (
          <Chip key={hint} label={hint} size="small" onClick={() => setInput((prev) => prev || hint)} />
        ))}
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('chat.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          multiline
          minRows={1}
          maxRows={6}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        {!!input && (
          <Tooltip title="Clear (Esc)">
            <span>
              <IconButton color="inherit" onClick={() => setInput('')} disabled={sending}><ClearIcon /></IconButton>
            </span>
          </Tooltip>
        )}
        <IconButton color="primary" onClick={send} disabled={sending || !input.trim()}><SendIcon /></IconButton>
      </Stack>
    </Stack>
  );
};
