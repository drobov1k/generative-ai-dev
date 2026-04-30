import uuid
from dataclasses import dataclass
from typing import Optional

from embeddings.embedder import Embedder


@dataclass
class ProcessedChunk:
    id: str
    document_id: str
    content: str
    position: int
    token_count: int
    embedding: list[float]


class DocumentProcessor:
    CHUNK_SIZE = 500   # tokens (approximated as words)
    OVERLAP = 50

    def __init__(self, embedder: Embedder):
        self._embedder = embedder

    async def process(
        self,
        content: bytes,
        filename: str,
        document_id: Optional[str] = None,
    ) -> str:
        doc_id = document_id or str(uuid.uuid4())
        text = self._extract_text(content, filename)
        chunks = self._chunk(text)
        embeddings = await self._embedder.embed_batch([c.content for c in chunks])

        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding

        # TODO: persist chunks to vector store and metadata to DynamoDB
        return doc_id

    def _extract_text(self, content: bytes, filename: str) -> str:
        lower = filename.lower()
        if lower.endswith(".pdf"):
            return self._parse_pdf(content)
        if lower.endswith(".docx"):
            return self._parse_docx(content)
        return content.decode("utf-8", errors="replace")

    def _parse_pdf(self, content: bytes) -> str:
        try:
            import io
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            return content.decode("utf-8", errors="replace")

    def _parse_docx(self, content: bytes) -> str:
        try:
            import io
            from docx import Document
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs)
        except Exception:
            return content.decode("utf-8", errors="replace")

    def _chunk(self, text: str) -> list[ProcessedChunk]:
        words = text.split()
        chunks: list[ProcessedChunk] = []
        step = self.CHUNK_SIZE - self.OVERLAP
        for i, start in enumerate(range(0, len(words), step)):
            segment = " ".join(words[start : start + self.CHUNK_SIZE])
            if not segment.strip():
                continue
            chunks.append(
                ProcessedChunk(
                    id=str(uuid.uuid4()),
                    document_id="",  # filled by caller
                    content=segment,
                    position=i,
                    token_count=len(segment.split()),
                    embedding=[],
                )
            )
        return chunks
