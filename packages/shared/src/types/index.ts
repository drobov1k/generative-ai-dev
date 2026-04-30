// Canonical domain types — kept in sync with specs/domain.yaml

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface Document {
  id: string;
  filename: string;
  contentType: string;
  s3Key: string;
  status: DocumentStatus;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  position: number;
  tokenCount: number;
  metadata?: {
    page?: number;
    heading?: string;
    [key: string]: unknown;
  };
}

export interface Query {
  id: string;
  question: string;
  documentIds?: string[];
  topK: number;
  createdAt: string;
}

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// HTTP request / response shapes — kept in sync with specs/openapi.yaml

export interface UploadResponse {
  document_id: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}

export interface QueryRequest {
  question: string;
  document_ids?: string[];
  top_k?: number;
}

export interface QueryResponse {
  answer: string;
  question: string;
  sources: RetrievalResult[];
}

export interface HealthResponse {
  status: string;
  version: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
}
