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
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Placeholder pro evaluation API - implementace bude později
const evaluationApi = {
  evaluateSingle: async (question: string, groundTruth?: string) => {
    // Mock response
    return {
      question,
      answer: 'This is a sample answer for demonstration purposes.',
      metrics: {
        faithfulness: 0.85,
        answer_relevancy: 0.92,
        context_precision: 0.78,
        context_recall: 0.88,
      },
      performance: {
        retrieval_time: 0.234,
        generation_time: 1.567,
        total_time: 1.801,
      },
    };
  },

  getBatches: async () => {
    // Mock response
    return [
      {
        id: 1,
        name: 'Test Batch 1',
        total_evaluations: 10,
        avg_faithfulness: 0.84,
        avg_answer_relevancy: 0.89,
        avg_context_precision: 0.76,
        avg_context_recall: 0.82,
        created_at: new Date().toISOString(),
      },
    ];
  },
};

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
      <Typography variant="h4" component="h1" gutterBottom>
        Evaluation
      </Typography>

      <Grid container spacing={3}>
        {/* Single Evaluation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Single Question Evaluation
              </Typography>
              
              <TextField
                fullWidth
                label="Question"
                multiline
                rows={3}
                value={singleQuestion}
                onChange={(e) => setSingleQuestion(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Ground Truth (Optional)"
                multiline
                rows={2}
                value={singleGroundTruth}
                onChange={(e) => setSingleGroundTruth(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={handleSingleEvaluation}
                disabled={!singleQuestion.trim() || singleEvaluationMutation.isPending}
                startIcon={singleEvaluationMutation.isPending ? <CircularProgress size={16} /> : <PlayIcon />}
              >
                Evaluate
              </Button>

              {/* Single Evaluation Results */}
              {singleEvaluationMutation.data && (
                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Results
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Answer:</strong> {singleEvaluationMutation.data.answer}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2}>
                    {Object.entries(singleEvaluationMutation.data.metrics).map(([metric, value]) => (
                      <Grid item xs={6} key={metric}>
                        <Box textAlign="center">
                          <Typography variant="caption" display="block" textTransform="capitalize">
                            {metric.replace('_', ' ')}
                          </Typography>
                          <Chip
                            label={formatMetric(value as number)}
                            color={getMetricColor(value as number)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Box mt={2}>
                    <Typography variant="caption" color="textSecondary">
                      Total Time: {singleEvaluationMutation.data.performance.total_time.toFixed(3)}s
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Batch Evaluation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Batch Evaluation
              </Typography>
              
              <TextField
                fullWidth
                label="Batch Name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                sx={{ mb: 2 }}
              />

              {batchQuestions.map((q, index) => (
                <Box key={index} mb={2} p={2} bgcolor="grey.50" borderRadius={1}>
                  <TextField
                    fullWidth
                    label={`Question ${index + 1}`}
                    value={q.question}
                    onChange={(e) => updateBatchQuestion(index, 'question', e.target.value)}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Ground Truth (Optional)"
                    value={q.ground_truth}
                    onChange={(e) => updateBatchQuestion(index, 'ground_truth', e.target.value)}
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
            </CardContent>
          </Card>
        </Grid>

        {/* Evaluation History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evaluation Batches
              </Typography>
              
              {batchesLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Batch Name</TableCell>
                        <TableCell>Evaluations</TableCell>
                        <TableCell>Avg Faithfulness</TableCell>
                        <TableCell>Avg Relevancy</TableCell>
                        <TableCell>Avg Precision</TableCell>
                        <TableCell>Avg Recall</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batches?.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell>{batch.name}</TableCell>
                          <TableCell>{batch.total_evaluations}</TableCell>
                          <TableCell>
                            <Chip
                              label={formatMetric(batch.avg_faithfulness)}
                              color={getMetricColor(batch.avg_faithfulness)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatMetric(batch.avg_answer_relevancy)}
                              color={getMetricColor(batch.avg_answer_relevancy)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatMetric(batch.avg_context_precision)}
                              color={getMetricColor(batch.avg_context_precision)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatMetric(batch.avg_context_recall)}
                              color={getMetricColor(batch.avg_context_recall)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(batch.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {batches?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="textSecondary">
                              No evaluation batches yet
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
        </Grid>
      </Grid>
    </Box>
  );
}
