from typing import Optional


class QdrantStore:
    def add(self, chunks: list) -> None:
        raise NotImplementedError("Qdrant backend not yet implemented")

    def search(
        self,
        query_vector: list[float],
        document_ids: Optional[list[str]],
        top_k: int = 5,
    ) -> list:
        raise NotImplementedError("Qdrant backend not yet implemented")
