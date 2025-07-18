import React, { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Avatar,
  Grid,
  Divider,
  alpha,
  useTheme,
  Fade,
  Grow,
  Skeleton,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingIcon,
  Schedule as TimeIcon,
  CloudDone as ProcessedIcon,
} from '@mui/icons-material';
import { documentsApi } from '../lib/api';

interface FileTypeIconProps {
  filename: string;
  size?: 'small' | 'medium' | 'large';
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ filename, size = 'medium' }) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const iconSize = size === 'small' ? 16 : size === 'large' ? 32 : 24;
  
  switch (extension) {
    case 'pdf':
      return <PdfIcon sx={{ fontSize: iconSize, color: '#d32f2f' }} />;
    case 'docx':
    case 'doc':
      return <DocIcon sx={{ fontSize: iconSize, color: '#1976d2' }} />;
    case 'txt':
    case 'md':
      return <CodeIcon sx={{ fontSize: iconSize, color: '#388e3c' }} />;
    default:
      return <FileIcon sx={{ fontSize: iconSize, color: 'text.secondary' }} />;
  }
};

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ComponentType<any>;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => {
  const theme = useTheme();
  
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
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
          borderRadius: '12px 12px 0 0',
        }
      }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography color="text.secondary" gutterBottom variant="body2" fontWeight={500}>
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ color }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.8)})`,
                boxShadow: `0 8px 16px ${alpha(color, 0.3)}`,
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

export default function Documents() {
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setDragActive(false);
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusChip = (doc: any) => {
    if (doc.processed) {
      return (
        <Chip 
          icon={<CheckIcon />} 
          label="Processed" 
          color="success" 
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    } else if (doc.processing_error) {
      return (
        <Chip 
          icon={<ErrorIcon />} 
          label="Failed" 
          color="error" 
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    } else {
      return (
        <Chip 
          icon={<PendingIcon />} 
          label="Processing" 
          color="warning" 
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const totalDocuments = documents?.length || 0;
  const processedDocuments = documents?.filter(doc => doc.processed).length || 0;
  const failedDocuments = documents?.filter(doc => !doc.processed && doc.processing_error).length || 0;
  const totalSize = documents?.reduce((sum, doc) => sum + doc.file_size, 0) || 0;
  const totalChunks = documents?.reduce((sum, doc) => sum + doc.chunks_count, 0) || 0;

  return (
    <Box>
      {/* Header */}
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
                Document Library
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Upload, manage and process your documents with AI
              </Typography>
            </Box>
            
            <IconButton 
              size="small" 
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
              }}
              onClick={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Documents"
            value={totalDocuments}
            icon={FileIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Successfully Processed"
            value={processedDocuments}
            icon={ProcessedIcon}
            color={theme.palette.success.main}
            subtitle={`${totalDocuments > 0 ? Math.round((processedDocuments / totalDocuments) * 100) : 0}% success rate`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Storage"
            value={formatFileSize(totalSize)}
            icon={StorageIcon}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Text Chunks"
            value={totalChunks.toLocaleString()}
            icon={SpeedIcon}
            color={theme.palette.warning.main}
            subtitle="Ready for AI analysis"
          />
        </Grid>
      </Grid>

      {/* Upload Area */}
      <Fade in timeout={600}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              {...getRootProps()}
              sx={{
                border: `2px dashed ${isDragActive || dragActive ? theme.palette.primary.main : theme.palette.divider}`,
                borderRadius: 3,
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive || dragActive 
                  ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)})`
                  : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.5)}, transparent)`,
                transition: 'all 0.3s ease-in-out',
                transform: isDragActive || dragActive ? 'scale(1.02)' : 'scale(1)',
                '&:hover': { 
                  borderColor: theme.palette.primary.main,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                  transform: 'scale(1.01)',
                },
              }}
            >
              <input {...getInputProps()} />
              <Avatar sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto',
                mb: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}>
                <UploadIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {isDragActive || dragActive ? 'Drop files here' : 'Upload Documents'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Drag & drop files or click to browse
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip label="PDF" size="small" variant="outlined" />
                <Chip label="DOCX" size="small" variant="outlined" />
                <Chip label="TXT" size="small" variant="outlined" />
                <Chip label="MD" size="small" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Maximum file size: 10MB
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <Fade in>
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, transparent)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={20} />
              <Typography>
                Uploading and processing document...
              </Typography>
            </Box>
            <LinearProgress sx={{ mt: 1, borderRadius: 1 }} />
          </Alert>
        </Fade>
      )}

      {uploadMutation.isError && (
        <Fade in>
          <Alert severity="error" sx={{ mb: 2 }}>
            Upload failed: {uploadMutation.error?.message}
          </Alert>
        </Fade>
      )}

      {uploadMutation.isSuccess && (
        <Fade in>
          <Alert severity="success" sx={{ mb: 2 }}>
            Document uploaded successfully!
          </Alert>
        </Fade>
      )}

      {/* Documents Table */}
      <Fade in timeout={800}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Documents ({totalDocuments})
              </Typography>
              {failedDocuments > 0 && (
                <Badge badgeContent={failedDocuments} color="error">
                  <Chip 
                    label="Some failed"
                    color="error"
                    variant="outlined"
                    size="small"
                  />
                </Badge>
              )}
            </Box>
            
            {isLoading ? (
              <Box>
                {[...Array(5)].map((_, i) => (
                  <Box key={i} display="flex" alignItems="center" gap={2} py={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                    <Skeleton variant="text" width={60} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                ))}
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 600 }}>Document</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Chunks</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Uploaded</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents?.map((doc, index) => (
                      <Fade in key={doc.id} timeout={400 + index * 100}>
                        <TableRow 
                          sx={{ 
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.action.hover, 0.5),
                              transform: 'scale(1.001)',
                            },
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{ 
                                width: 40, 
                                height: 40,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }}>
                                <FileTypeIcon filename={doc.filename} />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                                  {doc.filename}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {doc.filename.split('.').pop()?.toUpperCase()} file
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{getStatusChip(doc)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {formatFileSize(doc.file_size)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {doc.chunks_count}
                              </Typography>
                              {doc.chunks_count > 0 && (
                                <Chip 
                                  label="indexed"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(doc.upload_time)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Delete document">
                              <IconButton
                                onClick={() => deleteMutation.mutate(doc.id)}
                                disabled={deleteMutation.isPending}
                                size="small"
                                sx={{
                                  color: theme.palette.error.main,
                                  '&:hover': { 
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    transform: 'scale(1.1)',
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      </Fade>
                    ))}
                    {documents?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Avatar sx={{ 
                              width: 60, 
                              height: 60, 
                              mb: 2,
                              bgcolor: alpha(theme.palette.text.secondary, 0.1),
                              color: 'text.secondary',
                            }}>
                              <FileIcon sx={{ fontSize: 30 }} />
                            </Avatar>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No documents uploaded yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Upload your first document to get started
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}