import { Avatar, Box, Stack, Typography } from '@mui/material';

export type BubbleRole = 'user' | 'assistant';

export function ChatBubble({ role, content, timestamp }: { role: BubbleRole; content: string; timestamp?: string }) {
  const isUser = role === 'user';
  return (
    <Stack direction={isUser ? 'row-reverse' : 'row'} spacing={1} alignItems="flex-end" className="fade-in">
      <Avatar sx={{ width: 28, height: 28, fontSize: 14, bgcolor: isUser ? 'primary.main' : 'secondary.main' }}>
        {isUser ? 'U' : 'A'}
      </Avatar>
      <Box sx={{
        maxWidth: '75%',
        px: 1.5,
        py: 1,
        borderRadius: 2,
        color: '#fff',
        backgroundColor: isUser ? '#6d72f3' : '#111a2e',
      }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{content}</Typography>
        {timestamp && (
          <Typography variant="caption" color="rgba(255,255,255,0.6)" sx={{ display: 'block', mt: 0.25 }}>
            {timestamp}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

