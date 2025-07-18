import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from './Dashboard';
import * as api from '../lib/api';

jest.mock('../lib/api');
const mockApi = api as jest.Mocked<typeof api>;

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard title', async () => {
    mockApi.documentsApi.list.mockResolvedValue([]);
    mockApi.chatApi.getSessions.mockResolvedValue([]);
    mockApi.healthApi.check.mockResolvedValue({ status: 'healthy' });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('displays document statistics', async () => {
    const mockDocuments = [
      { id: 1, filename: 'test1.pdf', processed: true, chunks_count: 5, file_size: 1024 },
      { id: 2, filename: 'test2.pdf', processed: false, chunks_count: 0, file_size: 2048 }
    ];

    mockApi.documentsApi.list.mockResolvedValue(mockDocuments);
    mockApi.chatApi.getSessions.mockResolvedValue([]);
    mockApi.healthApi.check.mockResolvedValue({ status: 'healthy' });

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Documents')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });
});
