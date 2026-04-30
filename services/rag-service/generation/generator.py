import json
import os
from typing import Optional
import boto3

from prompts.templates import SYSTEM_PROMPT

BEDROCK_MODEL_ID = os.getenv("GENERATION_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")


class Generator:
    def __init__(self, model_id: Optional[str] = None):
        self._model_id = model_id or BEDROCK_MODEL_ID
        self._client: Optional[object] = None

    def _bedrock(self):
        if self._client is None:
            self._client = boto3.client("bedrock-runtime", region_name=os.getenv("AWS_REGION", "us-east-1"))
        return self._client

    async def generate(self, prompt: str) -> str:
        if os.getenv("MOCK_GENERATION", "false").lower() == "true":
            return f"[Mock answer] Received prompt with {len(prompt)} characters."

        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "temperature": 0,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": prompt}],
        })
        response = self._bedrock().invoke_model(
            modelId=self._model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
