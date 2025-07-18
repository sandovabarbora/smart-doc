import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  alpha,
  useTheme,
  Fade,
  Grow,
  Skeleton,
} from '@mui/material';
import {
  Description as DocumentIcon,
  Chat as ChatIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  Assessment as MetricsIcon,
  Schedule as TimeIcon,
  Storage as StorageIcon,
  CloudDone as ProcessedIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { documentsApi, chatApi, healthApi } from '../lib/api';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  suffix?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  suffix = '',
  isLoading = false
}) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" height={32} />
            </Box>
            <Skeleton variant="circular" width={56} height={56} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grow in timeout={500}>
      <Card sx={{
        position: 'relative',
        overflow: 'visible',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
          borderRadius: '12px 12px 0 0',
        }
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box flex={1}>
              <Typography color="text.secondary" gutterBottom variant="body2" fontWeight={500}>
                {title}
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1} mb={1}>
                <Typography variant="h4" fontWeight={700} color={`${color}.main`}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {suffix}
                </Typography>
              </Box>
            </Box>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].dark})`,
                boxShadow: `0 8px 16px ${alpha(theme.palette[color].main, 0.3)}`,
              }}
            >
              <Icon sx={{ fontSize: 28 }} />
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );
};

export default function Dashboard() {
  const theme = useTheme();

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30000,
  });

  // Skutečné výpočty ze skutečných dat
  const totalDocuments = documents?.length || 0;
  const processedDocuments = documents?.filter(doc => doc.processed).length || 0;
  const failedDocuments = documents?.filter(doc => !doc.processed && doc.processing_error).length || 0;
  const totalSessions = sessions?.length || 0;
  const totalMessages = sessions?.reduce((sum, session) => sum + session.message_count, 0) || 0;
  const totalChunks = documents?.reduce((sum, doc) => sum + doc.chunks_count, 0) || 0;
  const totalSize = documents?.reduce((sum, doc) => sum + doc.file_size, 0) || 0;

  const processingRate = totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 0;
  const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Header Section */}
      <Fade in timeout={300}>
        <Box mb={4}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Dashboard Overview
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Monitor your document processing and AI interactions
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={health?.status === 'healthy' ? <CheckIcon /> : <ErrorIcon />}
                label={health?.status === 'healthy' ? 'System Healthy' : 'System Issues'}
                color={health?.status === 'healthy' ? 'success' : 'error'}
                variant="outlined"
              />
              <IconButton 
                size="small" 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Documents"
            value={totalDocuments}
            icon={DocumentIcon}
            color="primary"
            isLoading={docsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Processed Successfully"
            value={processedDocuments}
            icon={ProcessedIcon}
            color="success"
            isLoading={docsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Chat Sessions"
            value={totalSessions}
            icon={ChatIcon}
            color="info"
            isLoading={sessionsLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Messages"
            value={totalMessages}
            icon={AIIcon}
            color="secondary"
            isLoading={sessionsLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Metrics */}
        <Grid item xs={12} lg={8}>
          <Fade in timeout={600}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <Typography variant="h6" fontWeight={600}>
                    Performance Metrics
                  </Typography>
                  <Chip label="Live Data" size="small" color="primary" variant="outlined" />
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box mb={3}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          Document Processing Rate
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {processingRate.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={processingRate}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                          }
                        }}
                      />
                    </Box>

                    <Box mb={3}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          Chat Engagement
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {avgMessagesPerSession} avg/session
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min(avgMessagesPerSession * 10, 100)}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.info.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
                          }
                        }}
                      />
                    </Box>

                    <Box>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          System Health
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {health?.status === 'healthy' ? '100%' : '0%'}
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={health?.status === 'healthy' ? 100 : 0}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          }
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      height="100%"
                      sx={{
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                        borderRadius: 2,
                        position: 'relative',
                      }}
                    >
                      <Box textAlign="center">
                        <CircularProgress
                          variant="determinate"
                          value={processingRate}
                          size={120}
                          thickness={6}
                          sx={{
                            color: theme.palette.success.main,
                            '& .MuiCircularProgress-circle': {
                              strokeLinecap: 'round',
                            },
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <Typography variant="h5" fontWeight={700} color="success.main">
                            {processingRate.toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Success Rate
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={800}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={3}>
                  Quick Insights
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box textAlign="center" p={2}>
                      <Avatar sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        mx: 'auto',
                        mb: 1,
                      }}>
                        <StorageIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        {totalChunks.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Text Chunks Processed
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box textAlign="center" p={2}>
                      <Avatar sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: theme.palette.warning.main,
                        mx: 'auto',
                        mb: 1,
                      }}>
                        <SpeedIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        {formatFileSize(totalSize)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Storage Used
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box textAlign="center" p={2}>
                      <Avatar sx={{ 
                        width: 48, 
                        height: 48, 
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        mx: 'auto',
                        mb: 1,
                      }}>
                        <ErrorIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600}>
                        {failedDocuments}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Processing Failures
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
}
