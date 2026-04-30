from typing import Optional


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(x * x for x in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


class InMemoryVectorStore:
    def __init__(self) -> None:
        self._chunks: list = []

    def add(self, chunks: list) -> None:
        self._chunks.extend(chunks)

    def search(
        self,
        query_vector: list[float],
        document_ids: Optional[list[str]],
        top_k: int = 5,
    ) -> list:
        from retrieval.retriever import RetrievalResult

        candidates = (
            [c for c in self._chunks if c.document_id in document_ids]
            if document_ids
            else self._chunks
        )

        scored = [
            (_cosine(query_vector, c.embedding), c)
            for c in candidates
        ]
        scored.sort(key=lambda t: t[0], reverse=True)

        return [
            RetrievalResult(
                chunk_id=c.id,
                document_id=c.document_id,
                content=c.content,
                score=score,
                metadata={"position": c.position},
            )
            for score, c in scored[:top_k]
        ]
