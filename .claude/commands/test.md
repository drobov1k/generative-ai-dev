---
description: Run all tests — Python (pytest) and TypeScript (tsc typecheck)
---

Run the full test suite for the monorepo.

Steps:
1. **TypeScript typecheck** — from repo root, run `npm run typecheck --workspaces --if-present`. Report any type errors.
2. **Python typecheck** — from `services/rag-service/`, run `python -m py_compile main.py ingestion/processor.py embeddings/embedder.py retrieval/retriever.py generation/generator.py prompts/templates.py`. Report any syntax errors.
3. **Python pytest** — if a `tests/` directory exists in `services/rag-service/`, run `python -m pytest services/rag-service/tests/ -v`. If not, note that no tests exist yet.
4. Print a final pass/fail summary.

If $ARGUMENTS is provided, treat it as a filter and only run tests matching that string.
