import json
import os
from typing import Optional
import boto3


BEDROCK_MODEL_ID = os.getenv(
    "EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v2:0"
)
EMBEDDING_DIMS = 1024  # Titan v2 default


class Embedder:
    def __init__(self, model_id: Optional[str] = None):
        self._model_id = model_id or BEDROCK_MODEL_ID
        self._client: Optional[object] = None

    def _bedrock(self):
        if self._client is None:
            self._client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
        return self._client

    async def embed(self, text: str) -> list[float]:
        if os.getenv("MOCK_EMBEDDINGS", "false").lower() == "true":
            return [0.0] * EMBEDDING_DIMS

        body = json.dumps({"inputText": text})
        response = self._bedrock().invoke_model(
            modelId=self._model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        return result["embedding"]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        # Bedrock Titan does not support batch — call sequentially
        # TODO: add concurrency with asyncio.gather once we use async Bedrock client
        return [await self.embed(t) for t in texts]
