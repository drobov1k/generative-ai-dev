from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from retrieval.retriever import RetrievalResult

SYSTEM_PROMPT = (
    "You are a helpful assistant that answers questions strictly based on "
    "provided document excerpts. Follow these rules:\n"
    "1. Answer only from the provided context. Do not use outside knowledge.\n"
    "2. If the context does not contain the answer, say: "
    "'I don't have enough information in the provided documents to answer this.'\n"
    "3. Be concise and factual. Avoid padding or filler phrases.\n"
    "4. When relevant, cite the source number (e.g. '[Source 2]').\n"
    "5. Do not speculate or hallucinate citations."
)

_CONTEXT_TEMPLATE = """\
Use the following document excerpts to answer the question.

{context}

---

Question: {question}

Answer:"""


class PromptBuilder:
    def build(self, question: str, results: list[RetrievalResult]) -> str:
        if not results:
            context = "(No relevant document excerpts found.)"
        else:
            context = "\n\n".join(
                f"[Source {i + 1}] (doc: {r.document_id}, score: {r.score:.2f})\n{r.content}"
                for i, r in enumerate(results)
            )
        return _CONTEXT_TEMPLATE.format(context=context, question=question)
