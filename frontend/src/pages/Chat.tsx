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
  Avatar,
  IconButton,
  Tooltip,
  Fade,
  alpha,
  useTheme,
  Skeleton,
  InputAdornment,
  Badge,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  ExpandMore as ExpandMoreIcon,
  Source as SourceIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  AutoAwesome as SparkleIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Schedule as TimeIcon,
  TrendingUp as TrendingIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { chatApi } from '../lib/api';

export default function Chat() {
  const [message, setMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();
  const [promptStyle, setPromptStyle] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
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

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatTime(timestamp);
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPromptStyleConfig = (style: string) => {
    switch (style) {
      case 'analytical':
        return {
          icon: <AIIcon sx={{ fontSize: 16 }} />,
          label: 'Analytical',
          color: theme.palette.info.main,
          description: 'Deep analysis & insights'
        };
      case 'concise':
        return {
          icon: <SpeedIcon sx={{ fontSize: 16 }} />,
          label: 'Concise',
          color: theme.palette.warning.main,
          description: 'Quick & to the point'
        };
      default:
        return {
          icon: <SparkleIcon sx={{ fontSize: 16 }} />,
          label: 'Default',
          color: theme.palette.primary.main,
          description: 'Balanced responses'
        };
    }
  };

  const filteredSessions = sessions?.filter(session =>
    session.session_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const currentSession = sessions?.find(s => s.session_id === currentSessionId);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 3 }}>
      {/* Enhanced Sessions Sidebar */}
      <Card sx={{ 
        width: 350, 
        display: 'flex', 
        flexDirection: 'column',
        background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 0.9),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        {/* Sidebar Header */}
        <CardContent sx={{ pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Chat Sessions
            </Typography>
            <Tooltip title="New Chat">
              <IconButton
                size="small"
                onClick={handleNewChat}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  width: 36,
                  height: 36,
                  '&:hover': { 
                    bgcolor: theme.palette.primary.dark,
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Search */}
          <TextField
            size="small"
            fullWidth
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha(theme.palette.background.default, 0.5),
              }
            }}
          />
        </CardContent>

        {/* Sessions List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          {sessionsLoading ? (
            <Box p={2}>
              {[...Array(3)].map((_, i) => (
                <Box key={i} mb={2}>
                  <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center"
              height="200px"
              textAlign="center"
              p={2}
            >
              <Avatar sx={{ 
                width: 48, 
                height: 48, 
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}>
                <ChatIcon />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                No chat sessions yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Start a new conversation
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredSessions.map((session, index) => (
                <Fade in key={session.session_id} timeout={300 + index * 100}>
                  <ListItem sx={{ p: 0, mb: 1 }}>
                    <Card
                      sx={{
                        width: '100%',
                        cursor: 'pointer',
                        background: currentSessionId === session.session_id
                          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.light, 0.05)})`
                          : alpha(theme.palette.background.paper, 0.5),
                        border: currentSessionId === session.session_id 
                          ? `2px solid ${theme.palette.primary.main}` 
                          : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': { 
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.4 : 0.15)}`,
                          background: currentSessionId === session.session_id
                            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.light, 0.1)})`
                            : alpha(theme.palette.background.paper, 0.8),
                        },
                      }}
                      onClick={() => setCurrentSessionId(session.session_id)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                          <Box flex={1} minWidth={0}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight={600} 
                              noWrap 
                              sx={{ 
                                color: currentSessionId === session.session_id 
                                  ? theme.palette.primary.main 
                                  : theme.palette.text.primary 
                              }}
                            >
                              Session {session.session_id.slice(0, 8)}...
                            </Typography>
                            
                            <Box display="flex" alignItems="center" gap={1} mt={1} mb={1}>
                              <Badge 
                                badgeContent={session.message_count}
                                color="primary"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.75rem',
                                    height: 18,
                                    minWidth: 18,
                                  }
                                }}
                              >
                                <ChatIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              </Badge>
                              <Typography variant="caption" color="text.secondary">
                                messages
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(session.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <IconButton 
                            size="small" 
                            sx={{ 
                              opacity: 0.7,
                              '&:hover': { opacity: 1 }
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                            }}
                          >
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </ListItem>
                </Fade>
              ))}
            </List>
          )}
        </Box>
      </Card>

      {/* Main Chat Area */}
      <Card sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.7 : 0.95),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        {/* Chat Header */}
        <CardContent sx={{ 
          py: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.02)}, transparent)`,
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {currentSession ? `Session ${currentSession.session_id.slice(0, 8)}...` : 'Start New Chat'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentSession 
                  ? `${currentSession.message_count} messages • Created ${formatDate(currentSession.created_at)}`
                  : 'Ask questions about your uploaded documents'
                }
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Style</InputLabel>
                <Select
                  value={promptStyle}
                  label="Style"
                  onChange={(e) => setPromptStyle(e.target.value)}
                  sx={{
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  {['default', 'analytical', 'concise'].map((style) => {
                    const config = getPromptStyleConfig(style);
                    return (
                      <MenuItem key={style} value={style}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: config.color }}>{config.icon}</Box>
                          <Box>
                            <Typography variant="body2">{config.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {config.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              
              {currentSession && (
                <Chip 
                  label={`${messages?.length || 0} messages`}
                  variant="outlined"
                  size="small"
                  icon={<TrendingIcon fontSize="small" />}
                />
              )}
            </Box>
          </Box>
        </CardContent>

        {/* Messages Area */}
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'auto', 
          p: 3,
          background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.01)}, transparent)`,
        }}>
          {messagesLoading ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {[...Array(3)].map((_, i) => (
                <Box key={i} display="flex" gap={2} alignItems="flex-start">
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="rectangular" width="60%" height={60} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          ) : !currentSession ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              textAlign="center"
            >
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mb: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}>
                <BotIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Welcome to Smart Doc AI
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
                Start a conversation by asking questions about your uploaded documents. 
                I'll help you find insights and analyze your content.
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={handleNewChat}
                startIcon={<SparkleIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }}
              >
                Start New Chat
              </Button>
            </Box>
          ) : messages?.length === 0 ? (
            <Box 
              display="flex" 
              flexDirection="column" 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              textAlign="center"
            >
              <Avatar sx={{ 
                width: 64, 
                height: 64, 
                mb: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}>
                <BotIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Start the conversation
              </Typography>
              <Typography color="text.secondary">
                Ask me anything about your documents
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {messages?.map((msg, index) => (
                <Fade in key={msg.id} timeout={300 + index * 100}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={1.5}>
                      <Avatar sx={{ 
                        width: 36, 
                        height: 36,
                        bgcolor: msg.type === 'user' ? theme.palette.primary.main : theme.palette.secondary.main,
                      }}>
                        {msg.type === 'user' ? (
                          <PersonIcon sx={{ fontSize: 20 }} />
                        ) : (
                          <BotIcon sx={{ fontSize: 20 }} />
                        )}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {msg.type === 'user' ? 'You' : 'AI Assistant'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(msg.timestamp)}
                      </Typography>
                      {msg.response_time && (
                        <Chip
                          label={`${msg.response_time.toFixed(2)}s`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem', height: 22 }}
                        />
                      )}
                    </Box>
                    
                    <Paper
                      sx={{
                        p: 2.5,
                        ml: 5,
                        background: msg.type === 'user' 
                          ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                          : alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.8 : 0.9),
                        color: msg.type === 'user' ? 'white' : theme.palette.text.primary,
                        border: msg.type === 'assistant' ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                        borderRadius: 3,
                        position: 'relative',
                        backdropFilter: 'blur(10px)',
                        '&::before': msg.type === 'user' ? {
                          content: '""',
                          position: 'absolute',
                          top: 16,
                          left: -8,
                          width: 0,
                          height: 0,
                          borderStyle: 'solid',
                          borderWidth: '8px 8px 8px 0',
                          borderColor: `transparent ${theme.palette.primary.main} transparent transparent`,
                        } : {},
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {msg.content}
                      </Typography>
                    </Paper>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <Box sx={{ ml: 5, mt: 1 }}>
                        <Accordion 
                          sx={{ 
                            boxShadow: 'none',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            bgcolor: alpha(theme.palette.background.paper, 0.5),
                            '&:before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                              '& .MuiAccordionSummary-content': { alignItems: 'center' },
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={1}>
                              <SourceIcon sx={{ color: theme.palette.primary.main }} />
                              <Typography variant="body2" fontWeight={500}>
                                Sources ({msg.sources.length})
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 1 }}>
                            {msg.sources.map((source, idx) => (
                              <Paper 
                                key={idx} 
                                sx={{ 
                                  p: 2, 
                                  mb: 1,
                                  bgcolor: alpha(theme.palette.info.main, 0.05),
                                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                                  borderRadius: 2,
                                }}
                              >
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                                  <Typography variant="caption" fontWeight="bold" color="info.main">
                                    📄 {source.source}
                                  </Typography>
                                  <Chip 
                                    label={`${(source.similarity * 100).toFixed(1)}% match`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {source.content_preview}
                                </Typography>
                              </Paper>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    )}
                  </Box>
                </Fade>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ 
          p: 3, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
        }}>
          <Box display="flex" gap={2} alignItems="end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your documents..."
              disabled={sendMessageMutation.isPending}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.default, 0.7),
                  },
                  '&.Mui-focused': {
                    backgroundColor: alpha(theme.palette.background.default, 0.7),
                  },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              sx={{
                minWidth: 56,
                height: 56,
                borderRadius: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
                '&:disabled': {
                  background: alpha(theme.palette.action.disabled, 0.5),
                },
              }}
            >
              {sendMessageMutation.isPending ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
