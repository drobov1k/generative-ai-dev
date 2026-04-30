---
description: Send a test RAG query to the local Python service. Usage: /rag-query <your question>
---

Send a test query to the locally running Python RAG service.

Question: $ARGUMENTS

Steps:
1. If no question was provided, use "What is this document about?" as the default.
2. Check that the service is running: `curl -s http://localhost:8000/health`. If it's not running, tell the user to run `/dev` first.
3. Send the query:
   ```
   curl -s -X POST http://localhost:8000/query \
     -H "Content-Type: application/json" \
     -d '{"question": "<question>", "top_k": 3}'
   ```
4. Pretty-print the JSON response.
5. Highlight the `answer` field and how many `sources` were returned.
6. If the answer looks like a mock placeholder, remind the user to set `MOCK_GENERATION=false` and configure real AWS credentials for live Bedrock responses.
