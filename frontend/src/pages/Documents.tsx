import React, { useCallback } from 'react';
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
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { documentsApi } from '../lib/api';

export default function Documents() {
  const queryClient = useQueryClient();

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
    acceptedFiles.forEach((file) => {
      uploadMutation.mutate(file);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
      return <Chip icon={<CheckIcon />} label="Processed" color="success" size="small" />;
    } else if (doc.processing_error) {
      return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />;
    } else {
      return <Chip icon={<PendingIcon />} label="Processing" color="warning" size="small" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Documents
      </Typography>

      {/* Upload Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supports PDF, DOCX, TXT, MD files (max 10MB)
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center">
            <CircularProgress size={20} sx={{ mr: 2 }} />
            Uploading and processing document...
          </Box>
        </Alert>
      )}

      {uploadMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Upload failed: {uploadMutation.error?.message}
        </Alert>
      )}

      {uploadMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Document uploaded successfully!
        </Alert>
      )}

      {/* Documents Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents ({documents?.length || 0})
          </Typography>
          
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Filename</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell>Chunks</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents?.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.filename}</TableCell>
                      <TableCell>{getStatusChip(doc)}</TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>{doc.chunks_count}</TableCell>
                      <TableCell>
                        {new Date(doc.upload_time).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => deleteMutation.mutate(doc.id)}
                          color="error"
                          disabled={deleteMutation.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">
                          No documents uploaded yet
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
