import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Layout from './Layout';

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Layout Component', () => {
  it('renders navigation items', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Evaluation')).toBeInTheDocument();
  });

  it('renders app title', () => {
    render(
      <TestWrapper>
        <Layout>
          <div>Test content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByText('Smart Doc AI')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <TestWrapper>
        <Layout>
          <div data-testid="test-content">Test content</div>
        </Layout>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });
});
