#!/usr/bin/env python3
"""
PostToolUse hook — fires after Edit or Write.
Reads the modified file path from stdin JSON, and if it's a source code file
prints a targeted reminder so Claude updates the relevant documentation.
"""
import json
import os
import sys


SOURCE_EXTENSIONS = {".py", ".ts", ".tsx"}

SKIP_PATTERNS = [
    "README", "CLAUDE", "/specs/", "/.claude/",
    "node_modules", "__pycache__", ".env", "dist/",
]

AREA_RULES = [
    ("services/llm-python/main.py",             "Python FastAPI entrypoint",      ["README.md (Architecture)", "specs/openapi.yaml (if routes changed)"]),
    ("services/llm-python/ingestion",            "Python ingestion module",        ["README.md (RAG Pipeline section)", "specs/rag-pipeline.md"]),
    ("services/llm-python/embeddings",           "Python embeddings module",       ["README.md (RAG Pipeline section)", "specs/rag-pipeline.md"]),
    ("services/llm-python/retrieval",            "Python retrieval module",        ["README.md (RAG Pipeline section)", "specs/rag-pipeline.md"]),
    ("services/llm-python/generation",           "Python generation module",       ["README.md (RAG Pipeline section)", "specs/prompts.yaml"]),
    ("services/llm-python/prompts",              "Python prompt templates",        ["specs/prompts.yaml", "README.md (The RAG Pipeline section)"]),
    ("apps/api/src/handlers",                    "TypeScript Lambda handler",      ["README.md", "specs/openapi.yaml (if request/response shapes changed)"]),
    ("apps/api/src/client/python-service.ts",    "TS↔Python communication layer", ["README.md (How TypeScript and Python Communicate)", "CLAUDE.md"]),
    ("packages/shared/src/types",                "shared TypeScript types",        ["specs/domain.yaml (keep in sync)", "README.md"]),
    ("infra/cdk/lib/stack.ts",                   "CDK stack definition",           ["README.md (Architecture + Deployment sections)", "CLAUDE.md"]),
]


def classify(file_path: str):
    for pattern, area, docs in AREA_RULES:
        if pattern in file_path:
            return area, docs
    return None, None


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "") or tool_input.get("path", "")

    if not file_path:
        sys.exit(0)

    _, ext = os.path.splitext(file_path)
    if ext not in SOURCE_EXTENSIONS:
        sys.exit(0)

    if any(p in file_path for p in SKIP_PATTERNS):
        sys.exit(0)

    area, docs = classify(file_path)
    if not area:
        sys.exit(0)

    rel = os.path.relpath(file_path) if os.path.isabs(file_path) else file_path
    docs_list = ", ".join(docs)
    print(f"[docs-hook] {rel} ({area}) changed — review and update if needed: {docs_list}")


if __name__ == "__main__":
    main()
