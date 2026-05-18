import os
from typing import Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchAny,
    PointStruct,
    VectorParams,
)

COLLECTION = "documents"
DIMS = 1024  # Titan v2


class QdrantStore:
    def __init__(self) -> None:
        url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self._client = QdrantClient(url=url)
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        existing = {c.name for c in self._client.get_collections().collections}
        if COLLECTION not in existing:
            self._client.create_collection(
                collection_name=COLLECTION,
                vectors_config=VectorParams(size=DIMS, distance=Distance.COSINE),
            )

    def add(self, chunks: list) -> None:
        points = [
            PointStruct(
                id=chunk.id,
                vector=chunk.embedding,
                payload={
                    "document_id": chunk.document_id,
                    "content": chunk.content,
                    "position": chunk.position,
                },
            )
            for chunk in chunks
        ]
        self._client.upsert(collection_name=COLLECTION, points=points)

    def search(
        self,
        query_vector: list[float],
        document_ids: Optional[list[str]],
        top_k: int = 5,
    ) -> list:
        from retrieval.retriever import RetrievalResult

        query_filter = (
            Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchAny(any=document_ids),
                    )
                ]
            )
            if document_ids
            else None
        )

        hits = self._client.search(
            collection_name=COLLECTION,
            query_vector=query_vector,
            query_filter=query_filter,
            limit=top_k,
        )

        return [
            RetrievalResult(
                chunk_id=str(hit.id),
                document_id=hit.payload["document_id"],
                content=hit.payload["content"],
                score=hit.score,
                metadata={"position": hit.payload.get("position")},
            )
            for hit in hits
        ]
