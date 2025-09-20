import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, IconButton, Stack, TextField, Typography, LinearProgress, Chip, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { ChatBubble } from '../components/ChatBubble';
import { ScrollToBottom } from '../components/ScrollToBottom';

type ChatMsg = { id?: number; role: 'user' | 'assistant'; content: string; sent_at?: string };

export const AgentChat = () => {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);
  const { t } = useTranslation();

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

  // Persist last session id locally to allow resuming chats
  useEffect(() => {
    if (sessionId) localStorage.setItem('last_chat_session_id', String(sessionId));
  }, [sessionId]);

  const send = async () => {
    if (!token || !sessionId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    const stamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { role: 'user', content, sent_at: stamp }]);
    const res = await api.chatMessagesCreate(token, sessionId, content);
    setSending(false);
    if (res.ok && res.data) {
      const astamp = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.assistant.content, sent_at: astamp }]);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={800}>{t('chat.title')}</Typography>
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
        {['Target CTOs in US','Add AI keywords','Location: EU','Role: Marketing'].map((hint) => (
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
