import asyncio
import os

import pytest

os.environ.setdefault("MOCK_EMBEDDINGS", "true")
os.environ.setdefault("MOCK_GENERATION", "true")
os.environ.setdefault("VECTOR_STORE", "memory")

from embeddings.embedder import Embedder
from ingestion.processor import DocumentProcessor
from retrieval.retriever import Retriever
from retrieval.stores.in_memory_store import InMemoryVectorStore
from prompts.templates import PromptBuilder
from generation.generator import Generator


@pytest.fixture
def pipeline():
    embedder = Embedder()
    store = InMemoryVectorStore()
    processor = DocumentProcessor(embedder, store)
    retriever = Retriever(embedder, store)
    return processor, retriever, store


def test_ingest_populates_store(pipeline):
    processor, _, store = pipeline
    doc_id = asyncio.run(
        processor.process(b"The cat sat on the mat.", "test.txt")
    )
    assert len(store._chunks) > 0
    assert all(c.document_id == doc_id for c in store._chunks)


def test_query_returns_ingested_chunks(pipeline):
    processor, retriever, _ = pipeline
    doc_id = asyncio.run(
        processor.process(b"The cat sat on the mat.", "test.txt")
    )
    results = asyncio.run(
        retriever.retrieve("what is on the mat?", None, top_k=3)
    )
    assert len(results) > 0
    assert results[0].document_id == doc_id


def test_query_filter_by_document_id(pipeline):
    processor, retriever, _ = pipeline
    doc_a = asyncio.run(processor.process(b"Document A content.", "a.txt"))
    doc_b = asyncio.run(processor.process(b"Document B content.", "b.txt"))

    results = asyncio.run(retriever.retrieve("content", [doc_a], top_k=5))
    assert all(r.document_id == doc_a for r in results)


def test_full_pipeline_end_to_end():
    embedder = Embedder()
    store = InMemoryVectorStore()
    processor = DocumentProcessor(embedder, store)
    retriever = Retriever(embedder, store)
    prompt_builder = PromptBuilder()
    generator = Generator()

    asyncio.run(
        processor.process(b"Photosynthesis converts sunlight into energy.", "bio.txt")
    )
    results = asyncio.run(retriever.retrieve("How do plants make energy?", None, top_k=3))
    prompt = prompt_builder.build("How do plants make energy?", results)
    answer = asyncio.run(generator.generate(prompt))

    assert isinstance(answer, str)
    assert len(answer) > 0
