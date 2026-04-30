# generative-ai-dev

RAG-based Document Q&A system on AWS. Polyglot monorepo: **TypeScript** owns the API/orchestration layer, **Python** owns all LLM and RAG logic.

## Architecture

```
User → API Gateway → TS Lambda handlers (apps/api)

Python Lambda (services/rag-service) — RAG service, integration pattern TBD
    ↓
Bedrock (embeddings + generation) + Vector Store
```

> The integration between the TS API layer and the Python RAG service is not yet decided.
> Do not assume or re-introduce a TS→Python call pattern without an explicit decision.

## Key Directories

| Path | Purpose |
|------|---------|
| `specs/` | Source of truth — change specs before changing code |
| `services/rag-service/` | ALL LLM/RAG logic: ingestion, embeddings, retrieval, generation |
| `apps/api/src/handlers/` | TS Lambda handlers — currently stubbed, backend integration TBD |
| `packages/shared/src/types/index.ts` | Canonical TS types, mirror of `specs/domain.yaml` |
| `infra/cdk/lib/stack.ts` | Full AWS stack (S3, Lambda×4, API GW) |

## Local Dev

```bash
# Python service — no AWS credentials needed in mock mode
cd services/rag-service
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

## Git Workflow

After completing any code changes, always follow these steps in order:

1. **Pull latest master** — `git checkout master && git pull origin master`
2. **Create a branch** — branch name must follow the convention:
   - `feat(<spec-number>): <short description>` for new features
   - `fix(<spec-number>): <short description>` for bug fixes
   - `<spec-number>` is the relevant spec identifier (e.g. `rag-01`, `api-03`); omit if not tied to a spec
   - Example: `feat(rag-02): add qdrant vector store backend`
3. **Commit** — stage changed files and commit with a message matching the same convention as the branch name
4. **Push** — `git push -u origin <branch-name>`
5. **Enable automerge** — `gh pr merge --auto --squash` (requires branch protection rules and automerge enabled in repo settings)
6. **Switch back to master** — `git checkout master`

Never commit directly to master. Always confirm the branch name with the user if the spec number is unclear.

## Environment Variables

Controlled via `services/rag-service/.env` (copy from `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `MOCK_EMBEDDINGS` | `true` | Skip Bedrock embedding calls |
| `MOCK_GENERATION` | `true` | Skip Bedrock generation calls |
| `VECTOR_STORE` | `mock` | `mock` / `qdrant` / `opensearch` |
| `EMBEDDING_MODEL_ID` | `amazon.titan-embed-text-v2:0` | Bedrock model |
| `GENERATION_MODEL_ID` | `anthropic.claude-3-sonnet-20240229-v1:0` | Bedrock model |
