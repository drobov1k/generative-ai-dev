---
description: Verify that the implementation aligns with the specs in /specs
---

Audit the implementation against the spec files in `specs/`.

Checks to perform:

1. **OpenAPI vs handlers** (`specs/openapi.yaml` vs `apps/api/src/handlers/`)
   - Every path in openapi.yaml has a corresponding handler file
   - Handler request/response shapes match the spec schemas
   - HTTP status codes match

2. **Domain model sync** (`specs/domain.yaml` vs `packages/shared/src/types/index.ts`)
   - Every domain entity in the YAML has a corresponding TypeScript interface
   - Field names and types are consistent (accounting for camelCase vs snake_case convention)

3. **Prompt spec** (`specs/prompts.yaml` vs `services/rag-service/prompts/templates.py`)
   - `SYSTEM_PROMPT` in templates.py reflects the intent of `system_prompt` in prompts.yaml
   - Context format variables `{context}` and `{question}` are present

4. **RAG pipeline** (`specs/rag-pipeline.md` vs `services/rag-service/`)
   - All pipeline stages (ingestion, chunking, embedding, retrieval, generation) have corresponding module files

Report each check as PASS / WARN / FAIL with a brief explanation. Suggest concrete fixes for any failures.
