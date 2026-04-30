---
description: Start the Python FastAPI service in mock mode (no AWS credentials needed)
---

Start the Python development server for the RAG service.

Steps:
1. Check if `services/llm-python/.env` exists. If not, copy from `.env.example` and confirm `MOCK_EMBEDDINGS=true` and `MOCK_GENERATION=true` are set.
2. From `services/llm-python/`, run `uvicorn main:app --reload --port 8000`.
3. After it starts, hit `curl -s http://localhost:8000/health` and show the response.
4. Print a short summary of the available endpoints: GET /health, POST /upload, POST /query.

If the server fails to start, show the error and suggest a fix (most likely missing dependencies — run `pip install -r requirements.txt`).
