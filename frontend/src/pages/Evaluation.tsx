import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
  Fade,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { evaluationApi } from '../lib/api';

interface QuestionInput {
  question: string;
  ground_truth?: string;
}

export default function Evaluation() {
  const [singleQuestion, setSingleQuestion] = useState('');
  const [singleGroundTruth, setSingleGroundTruth] = useState('');
  const [batchQuestions, setBatchQuestions] = useState<QuestionInput[]>([
    { question: '', ground_truth: '' }
  ]);
  const [batchName, setBatchName] = useState('');
  const theme = useTheme();

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['evaluation-batches'],
    queryFn: evaluationApi.getBatches,
  });

  const singleEvaluationMutation = useMutation({
    mutationFn: ({ question, groundTruth }: { question: string; groundTruth?: string }) =>
      evaluationApi.evaluateSingle(question, groundTruth),
  });

  const handleSingleEvaluation = () => {
    if (!singleQuestion.trim()) return;
    
    singleEvaluationMutation.mutate({
      question: singleQuestion.trim(),
      groundTruth: singleGroundTruth.trim() || undefined,
    });
  };

  const addBatchQuestion = () => {
    setBatchQuestions([...batchQuestions, { question: '', ground_truth: '' }]);
  };

  const updateBatchQuestion = (index: number, field: 'question' | 'ground_truth', value: string) => {
    const updated = [...batchQuestions];
    updated[index][field] = value;
    setBatchQuestions(updated);
  };

  const formatMetric = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getMetricColor = (value: number) => {
    if (value >= 0.8) return 'success';
    if (value >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box>
      {/* Header */}
      <Fade in timeout={300}>
        <Box mb={4}>
          <Typography 
            variant="h4" 
            fontWeight={700}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            gutterBottom
          >
            Evaluation Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Test and evaluate your AI assistant's performance with custom questions
          </Typography>
        </Box>
      </Fade>

      <Grid container spacing={3}>
        {/* Single Evaluation */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={400}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 40,
                    height: 40,
                  }}>
                    <AssessmentIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Single Question Test
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Question"
                  multiline
                  rows={3}
                  value={singleQuestion}
                  onChange={(e) => setSingleQuestion(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Ask a question about your documents..."
                />
                
                <TextField
                  fullWidth
                  label="Expected Answer (Optional)"
                  multiline
                  rows={2}
                  value={singleGroundTruth}
                  onChange={(e) => setSingleGroundTruth(e.target.value)}
                  sx={{ mb: 3 }}
                  placeholder="What should the ideal answer be?"
                />
                
                <Button
                  variant="contained"
                  onClick={handleSingleEvaluation}
                  disabled={!singleQuestion.trim() || singleEvaluationMutation.isPending}
                  startIcon={singleEvaluationMutation.isPending ? <CircularProgress size={16} /> : <PlayIcon />}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                  }}
                >
                  {singleEvaluationMutation.isPending ? 'Evaluating...' : 'Run Evaluation'}
                </Button>

                {/* Single Evaluation Results */}
                {singleEvaluationMutation.data && (
                  <Box mt={3}>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Evaluation Results
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>AI Response:</strong><br />
                        {singleEvaluationMutation.data.answer}
                      </Typography>
                    </Alert>

                    <Grid container spacing={2}>
                      {Object.entries(singleEvaluationMutation.data.metrics).map(([metric, value]) => (
                        <Grid item xs={6} key={metric}>
                          <Box textAlign="center" p={1}>
                            <Typography variant="caption" display="block" textTransform="capitalize" gutterBottom>
                              {metric.replace('_', ' ')}
                            </Typography>
                            <Chip
                              label={formatMetric(value as number)}
                              color={getMetricColor(value as number)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Box mt={2} textAlign="center">
                      <Typography variant="caption" color="text.secondary">
                        Response Time: {singleEvaluationMutation.data.performance.total_time.toFixed(3)}s
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Batch Evaluation */}
        <Grid item xs={12} md={6}>
          <Fade in timeout={600}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                    color: theme.palette.secondary.main,
                    width: 40,
                    height: 40,
                  }}>
                    <TrendingIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    Batch Evaluation
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Batch Name"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="e.g., Q4 Performance Test"
                />

                {batchQuestions.map((q, index) => (
                  <Box key={index} mb={2} p={2} sx={{ bgcolor: alpha(theme.palette.grey[500], 0.05), borderRadius: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Question {index + 1}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Question"
                      value={q.question}
                      onChange={(e) => updateBatchQuestion(index, 'question', e.target.value)}
                      sx={{ mb: 1 }}
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Expected Answer (Optional)"
                      value={q.ground_truth}
                      onChange={(e) => updateBatchQuestion(index, 'ground_truth', e.target.value)}
                      size="small"
                    />
                  </Box>
                ))}

                <Box display="flex" gap={1} mt={2}>
                  <Button
                    variant="outlined"
                    onClick={addBatchQuestion}
                    startIcon={<AddIcon />}
                    size="small"
                  >
                    Add Question
                  </Button>
                  <Button
                    variant="contained"
                    disabled={!batchName.trim() || batchQuestions.every(q => !q.question.trim())}
                    startIcon={<PlayIcon />}
                    size="small"
                  >
                    Run Batch
                  </Button>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Batch evaluation will test multiple questions and provide aggregated metrics.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Evaluation History */}
        <Grid item xs={12}>
          <Fade in timeout={800}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Evaluation History
                </Typography>
                
                {batchesLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : !batches || batches.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Avatar sx={{ 
                      width: 60, 
                      height: 60, 
                      mx: 'auto',
                      mb: 2,
                      bgcolor: alpha(theme.palette.text.secondary, 0.1),
                      color: 'text.secondary',
                    }}>
                      <AssessmentIcon sx={{ fontSize: 30 }} />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No evaluations yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Run your first evaluation to see results here
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableCell sx={{ fontWeight: 600 }}>Batch Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Questions</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Avg Faithfulness</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Avg Relevancy</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Avg Precision</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Avg Recall</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {batches.map((batch) => (
                          <TableRow key={batch.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5) } }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {batch.name}
                              </Typography>
                            </TableCell>
                            <TableCell>{batch.total_evaluations}</TableCell>
                            <TableCell>
                              <Chip
                                label={formatMetric(batch.avg_faithfulness)}
                                color={getMetricColor(batch.avg_faithfulness)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatMetric(batch.avg_answer_relevancy)}
                                color={getMetricColor(batch.avg_answer_relevancy)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatMetric(batch.avg_context_precision)}
                                color={getMetricColor(batch.avg_context_precision)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={formatMetric(batch.avg_context_recall)}
                                color={getMetricColor(batch.avg_context_recall)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(batch.created_at).toLocaleDateString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
}
