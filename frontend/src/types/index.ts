export interface Document {
  id: number;
  filename: string;
  upload_time: string;
  file_size: number;
  processed: boolean;
  processing_error?: string;
  chunks_count: number;
}

export interface ChatMessage {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  response_time?: number;
}

export interface ChatSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export interface Source {
  id: string;
  source: string;
  chunk_index: number;
  similarity: number;
  content_preview: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  session_id: string;
  message_id: number;
  performance: {
    retrieval_time: number;
    generation_time: number;
    total_time: number;
  };
  confidence: number;
}
