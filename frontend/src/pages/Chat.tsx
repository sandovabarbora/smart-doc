import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  ExpandMore as ExpandMoreIcon,
  Source as SourceIcon,
} from '@mui/icons-material';
import { chatApi } from '../lib/api';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [promptStyle, setPromptStyle] = useState('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: sessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', currentSessionId],
    queryFn: () => currentSessionId ? chatApi.getMessages(currentSessionId) : Promise.resolve([]),
    enabled: !!currentSessionId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ message, sessionId, promptStyle }: { message: string; sessionId?: string; promptStyle: string }) =>
      chatApi.sendMessage(message, sessionId, promptStyle),
    onSuccess: (data) => {
      setCurrentSessionId(data.session_id);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setMessage('');
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      sessionId: currentSessionId,
      promptStyle,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Chat with Documents
      </Typography>

      <Box display="flex" gap={3} height="calc(100vh - 200px)">
        {/* Chat Sessions Sidebar */}
        <Card sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Chat Sessions
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              onClick={() => setCurrentSessionId(undefined)}
            >
              New Chat
            </Button>
            <List dense>
              {sessions?.map((session) => (
                <ListItem
                  key={session.session_id}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: currentSessionId === session.session_id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setCurrentSessionId(session.session_id)}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {session.session_id.slice(0, 8)}...
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {session.message_count} messages
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {formatTime(session.created_at)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Chat Settings */}
          <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Prompt Style</InputLabel>
              <Select
                value={promptStyle}
                label="Prompt Style"
                onChange={(e) => setPromptStyle(e.target.value)}
              >
                <MenuItem value="default">Default</MenuItem>
                <MenuItem value="analytical">Analytical</MenuItem>
                <MenuItem value="concise">Concise</MenuItem>
              </Select>
            </FormControl>
          </CardContent>

          {/* Messages Area */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            {messagesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {messages?.map((msg) => (
                  <Box key={msg.id} mb={2}>
                    <Box display="flex" alignItems="center" mb={1}>
                      {msg.type === 'user' ? (
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      ) : (
                        <BotIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      )}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {msg.type === 'user' ? 'You' : 'Assistant'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                        {formatTime(msg.timestamp)}
                      </Typography>
                      {msg.response_time && (
                        <Chip
                          label={`${msg.response_time.toFixed(2)}s`}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: msg.type === 'user' ? 'primary.light' : 'grey.100',
                        color: msg.type === 'user' ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>
                    </Paper>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <Accordion sx={{ mt: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box display="flex" alignItems="center">
                            <SourceIcon sx={{ mr: 1 }} />
                            <Typography variant="body2">
                              Sources ({msg.sources.length})
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          {msg.sources.map((source, idx) => (
                            <Box key={idx} mb={1} p={1} bgcolor="grey.50" borderRadius={1}>
                              <Typography variant="caption" fontWeight="bold">
                                {source.source} (similarity: {(source.similarity * 100).toFixed(1)}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {source.content_preview}
                              </Typography>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Message Input */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box display="flex" gap={1} alignItems="end">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your documents..."
                disabled={sendMessageMutation.isPending}
              />
              <Button
                variant="contained"
                onClick={handleSendMessage}
                disabled={!message.trim() || sendMessageMutation.isPending}
                sx={{ minWidth: 'auto', p: 1.5 }}
              >
                {sendMessageMutation.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
