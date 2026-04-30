# RAG Pipeline Specification

## Overview

Two distinct flows: **Ingestion** (write path) and **Retrieval + Generation** (read path).

---

## 1. Ingestion Flow

```
User uploads file
    │
    ▼
[TS Upload Handler]
  - Validate file type / size
  - Forward raw bytes to Python service (/upload)
    │
    ▼
[Python: DocumentProcessor]
  1. Parse raw bytes → plain text
     - PDF  → pdfminer / pypdf
     - DOCX → python-docx
     - TXT  → passthrough
  2. Chunk text
     - Strategy: sliding window (500 tokens, 50 overlap)
     - Preserve sentence boundaries where possible
  3. Embed each chunk
     - Call Embedder.embed(chunk.content)
     - Model: Amazon Titan Text Embeddings v2 (via Bedrock)
     - Dimensions: 1024 (Titan v2) or 1536 (ada-002 compat)
  4. Store chunks + embeddings
     - Vector store: OpenSearch Serverless (AWS) / pgvector (local)
     - Metadata store: DynamoDB
  5. Update Document.status → ready (or failed on error)
```

### Chunking Strategy

| Parameter   | Value | Rationale                                  |
|-------------|-------|--------------------------------------------|
| chunk_size  | 500   | Fits within context windows; coherent para |
| overlap     | 50    | Preserves context across chunk boundaries  |
| unit        | tokens| Stable across different text densities     |

---

## 2. Retrieval + Generation Flow

```
User submits question
    │
    ▼
[TS Query Handler]
  - Parse / validate QueryRequest
  - Forward to Python service (/query)
    │
    ▼
[Python: Retriever]
  1. Embed question
     - Same model as ingestion (critical: embedding space must match)
  2. Vector search
     - kNN query against vector store
     - Filter by document_ids if provided
     - Return top_k chunks with scores
    │
    ▼
[Python: PromptBuilder]
  3. Build prompt
     - Inject retrieved chunks as context
     - Apply system prompt + constraints (see prompts.yaml)
    │
    ▼
[Python: LLM call]
  4. Generate answer
     - Model: Claude 3 Sonnet via Amazon Bedrock
     - Max tokens: 1024
     - Temperature: 0 (factual retrieval task)
    │
    ▼
[Python: response]
  5. Return QueryResponse
     - answer: string
     - sources: RetrievalResult[]  (for citation display)
```

---

## 3. Error Handling

| Stage           | Error                  | Behaviour                          |
|-----------------|------------------------|------------------------------------|
| Parse           | Unsupported format     | 400 — reject before processing     |
| Embed (ingestion)| Bedrock throttle      | Retry x3 with exponential backoff  |
| Vector write    | Store unavailable      | Mark Document.status = failed      |
| Embed (query)   | Bedrock throttle       | 503 with Retry-After header        |
| Vector search   | No results             | Return empty sources; LLM answers "no info found" |
| LLM generation  | Bedrock error          | 503; do not surface raw error to user |

---

## 4. Local vs AWS

| Component      | Local (dev)             | AWS (prod)                        |
|----------------|-------------------------|-----------------------------------|
| Vector store   | Qdrant (Docker)         | OpenSearch Serverless             |
| Embeddings     | Mock / local Ollama     | Amazon Bedrock Titan Embeddings   |
| LLM            | Mock / local Ollama     | Amazon Bedrock Claude 3 Sonnet    |
| Object store   | MinIO (Docker)          | S3                                |
| Python runtime | FastAPI + uvicorn       | Lambda + Mangum                   |
