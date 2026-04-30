# generative-ai-dev

RAG-based Document Q&A system on AWS. Polyglot monorepo: **TypeScript** owns the API/orchestration layer, **Python** owns all LLM and RAG logic.

## Architecture

```
User → API Gateway → TS Lambda handlers (apps/api)

Python Lambda (services/llm-python) — RAG service, integration pattern TBD
    ↓
Bedrock (embeddings + generation) + Vector Store
```

> The integration between the TS API layer and the Python RAG service is not yet decided.
> Do not assume or re-introduce a TS→Python call pattern without an explicit decision.

## Key Directories

| Path | Purpose |
|------|---------|
| `specs/` | Source of truth — change specs before changing code |
| `services/llm-python/` | ALL LLM/RAG logic: ingestion, embeddings, retrieval, generation |
| `apps/api/src/handlers/` | TS Lambda handlers — currently stubbed, backend integration TBD |
| `packages/shared/src/types/index.ts` | Canonical TS types, mirror of `specs/domain.yaml` |
| `infra/cdk/lib/stack.ts` | Full AWS stack (S3, Lambda×4, API GW) |

## Local Dev

```bash
# Python service — no AWS credentials needed in mock mode
cd services/llm-python
cp .env.example .env          # MOCK_EMBEDDINGS=true, MOCK_GENERATION=true
pip install -r requirements.txt
python main.py                 # → http://localhost:8000

# Quick smoke test
curl http://localhost:8000/health
curl -s -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}' | python3 -m json.tool
```

## Conventions

**Python**
- Async functions for all I/O (FastAPI routes, Bedrock calls)
- Pydantic models for request/response validation
- `MOCK_*=true` env vars gate all external service calls — always check these work before touching Bedrock
- No business logic in `main.py` — it wires modules together only

**TypeScript**
- Handlers are thin: validate input → return response
- All domain types come from `@gen-ai/shared` — do not duplicate them
- Do not call Python code or scripts from TypeScript handlers

**Specs**
- `specs/openapi.yaml` is the contract — update it before changing API shapes
- `specs/domain.yaml` is the domain model — update it before changing shared types
- `specs/prompts.yaml` is version-controlled — treat prompt changes like code changes

## Environment Variables

Controlled via `services/llm-python/.env` (copy from `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `MOCK_EMBEDDINGS` | `true` | Skip Bedrock embedding calls |
| `MOCK_GENERATION` | `true` | Skip Bedrock generation calls |
| `VECTOR_STORE` | `mock` | `mock` / `qdrant` / `opensearch` |
| `EMBEDDING_MODEL_ID` | `amazon.titan-embed-text-v2:0` | Bedrock model |
| `GENERATION_MODEL_ID` | `anthropic.claude-3-sonnet-20240229-v1:0` | Bedrock model |
