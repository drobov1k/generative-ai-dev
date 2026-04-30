from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from ingestion.processor import DocumentProcessor
from embeddings.embedder import Embedder
from retrieval.retriever import Retriever, _build_vector_store
from prompts.templates import PromptBuilder
from generation.generator import Generator

app = FastAPI(title="LLM Python Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_embedder = Embedder()
_store = _build_vector_store()
_processor = DocumentProcessor(_embedder, _store)
_retriever = Retriever(_embedder, _store)
_prompt_builder = PromptBuilder()
_generator = Generator()


class QueryRequest(BaseModel):
    question: str
    document_ids: Optional[list[str]] = None
    top_k: int = 5


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": _now()}


@app.post("/upload", status_code=202)
async def upload(
    file: UploadFile = File(...),
    document_id: Optional[str] = Form(None),
):
    content = await file.read()
    doc_id = await _processor.process(
        content=content,
        filename=file.filename or "upload",
        document_id=document_id,
    )
    return {"document_id": doc_id, "status": "processing"}


@app.post("/query")
async def query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question must not be empty")

    results = await _retriever.retrieve(
        question=request.question,
        document_ids=request.document_ids,
        top_k=request.top_k,
    )
    prompt = _prompt_builder.build(request.question, results)
    answer = await _generator.generate(prompt)

    return {
        "answer": answer,
        "question": request.question,
        "sources": [r.to_dict() for r in results],
    }


def _now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
