import os
import uuid
from dataclasses import dataclass, field
from typing import Optional

from embeddings.embedder import Embedder


@dataclass
class RetrievalResult:
    chunk_id: str
    document_id: str
    content: str
    score: float
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "content": self.content,
            "score": self.score,
            "metadata": self.metadata,
        }


class Retriever:
    def __init__(self, embedder: Embedder):
        self._embedder = embedder
        self._vector_store = _build_vector_store()

    async def retrieve(
        self,
        question: str,
        document_ids: Optional[list[str]],
        top_k: int = 5,
    ) -> list[RetrievalResult]:
        query_embedding = await self._embedder.embed(question)
        return self._vector_store.search(query_embedding, document_ids, top_k)


def _build_vector_store():
    backend = os.getenv("VECTOR_STORE", "mock")
    if backend == "qdrant":
        from retrieval.stores.qdrant_store import QdrantStore
        return QdrantStore()
    if backend == "opensearch":
        from retrieval.stores.opensearch_store import OpenSearchStore
        return OpenSearchStore()
    return _MockVectorStore()


class _MockVectorStore:
    def search(
        self,
        embedding: list[float],
        document_ids: Optional[list[str]],
        top_k: int,
    ) -> list[RetrievalResult]:
        # Returns stub results so the full pipeline can be exercised locally
        return [
            RetrievalResult(
                chunk_id=str(uuid.uuid4()),
                document_id="mock-doc-1",
                content="This is a mock retrieved chunk. Replace with real vector search.",
                score=0.95,
            )
        ]
