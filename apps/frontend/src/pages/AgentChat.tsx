import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, IconButton, Stack, TextField, Typography, LinearProgress, Chip, Box, MenuItem, Select, FormControl, InputLabel, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
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
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
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
      const list = await api.chatSessionsIndex(token);
      if (list.ok && list.data) setSessions(list.data.chat_sessions || []);
      const stored = Number(localStorage.getItem('last_chat_session_id') || '');
      if (stored && !Number.isNaN(stored)) {
        const show = await api.chatSessionShow(token, stored);
        if (show.ok && show.data) {
          setSessionId(show.data.chat_session.id);
          const msgs = (show.data.chat_session.messages || []) as ChatMsg[];
          setMessages(msgs);
          return;
        }
      }
      const res = await api.chatSessionCreate(token);
      if (res.ok && res.data) setSessionId(res.data.chat_session.id);
    };
    init();
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
    // Let the server be source of truth; we optimistically push the user bubble
    // and then the poll will replace the set with server messages shortly.
    const stamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { role: 'user', content, sent_at: stamp }]);
    const res = await api.chatMessagesCreate(token, sessionId, content);
    setSending(false);
    if (res.ok && res.data) {
      const astamp = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.assistant.content, sent_at: astamp }]);
    }
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
      </Stack>
      <Card className="glass" sx={{ position: 'relative' }}>
        {sending && <LinearProgress color="secondary" />}
        <CardContent>
          <div ref={listRef} style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} timestamp={m.sent_at} />
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start' }}>
                <div className="typing">
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
        <TextField fullWidth size="small" placeholder={t('chat.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <IconButton color="primary" onClick={send} disabled={sending || !input.trim()}><SendIcon /></IconButton>
      </Stack>
    </Stack>
  );
};
