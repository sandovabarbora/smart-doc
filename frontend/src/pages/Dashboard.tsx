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
} from '@mui/material';
import {
  Description as DocumentIcon,
  Chat as ChatIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { documentsApi, chatApi, healthApi } from '../lib/api';

export default function Dashboard() {
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

  const totalDocuments = documents?.length || 0;
  const processedDocuments = documents?.filter(doc => doc.processed).length || 0;
  const failedDocuments = documents?.filter(doc => !doc.processed && doc.processing_error).length || 0;
  const totalSessions = sessions?.length || 0;

  const stats = [
    {
      title: 'Total Documents',
      value: totalDocuments,
      icon: DocumentIcon,
      color: 'primary',
    },
    {
      title: 'Processed',
      value: processedDocuments,
      icon: CheckIcon,
      color: 'success',
    },
    {
      title: 'Failed',
      value: failedDocuments,
      icon: ErrorIcon,
      color: 'error',
    },
    {
      title: 'Chat Sessions',
      value: totalSessions,
      icon: ChatIcon,
      color: 'secondary',
    },
  ];

  if (docsLoading || sessionsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Box mb={2}>
        <Chip
          label={health?.status === 'healthy' ? 'System Healthy' : 'System Issues'}
          color={health?.status === 'healthy' ? 'success' : 'error'}
          icon={health?.status === 'healthy' ? <CheckIcon /> : <ErrorIcon />}
        />
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="h6">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                  </Box>
                  <stat.icon 
                    sx={{ 
                      fontSize: 40, 
                      color: `${stat.color}.main` 
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Documents
              </Typography>
              {documents?.slice(0, 5).map((doc) => (
                <Box key={doc.id} py={1} borderBottom={1} borderColor="divider">
                  <Typography variant="body1">{doc.filename}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(doc.upload_time).toLocaleDateString()} • {doc.chunks_count} chunks
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Chat Sessions
              </Typography>
              {sessions?.slice(0, 5).map((session) => (
                <Box key={session.session_id} py={1} borderBottom={1} borderColor="divider">
                  <Typography variant="body1">
                    Session {session.session_id.slice(0, 8)}...
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {session.message_count} messages • {new Date(session.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
