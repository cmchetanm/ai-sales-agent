import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, IconButton, Stack, TextField, Typography, LinearProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

type ChatMsg = { id?: number; role: 'user' | 'assistant'; content: string; sent_at?: string };

export const AgentChat = () => {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const init = async () => {
      if (!token) return;
      const res = await api.chatSessionCreate(token);
      if (res.ok && res.data) setSessionId(res.data.chat_session.id);
    };
    init();
  }, [token]);

  const send = async () => {
    if (!token || !sessionId || !input.trim()) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    const res = await api.chatMessagesCreate(token, sessionId, content);
    setSending(false);
    if (res.ok && res.data) {
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.assistant.content }]);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={700}>{t('chat.title')}</Typography>
      <Card className="glass">
        {sending && <LinearProgress color="secondary" />}
        <CardContent>
          <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((m, i) => (
              <div key={i} className="fade-in" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                <div style={{ padding: '8px 12px', borderRadius: 12, background: m.role === 'user' ? '#6d72f3' : '#111a2e', color: '#fff' }}>
                  {m.content}
                </div>
              </div>
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
      </Card>
      <Stack direction="row" spacing={1}>
        <TextField fullWidth size="small" placeholder={t('chat.placeholder')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <IconButton color="primary" onClick={send} disabled={sending || !input.trim()}><SendIcon /></IconButton>
      </Stack>
    </Stack>
  );
};
