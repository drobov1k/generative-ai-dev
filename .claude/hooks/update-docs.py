#!/usr/bin/env python3
"""
PostToolUse hook — fires after Edit or Write.
If a source code file was changed, reminds Claude to check whether
README.md, CLAUDE.md, or specs/ need updating.
"""
import json
import os
import sys

SOURCE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx"}

SKIP_PATTERNS = [
    "README", "CLAUDE", "/specs/", "/.claude/",
    "node_modules", "__pycache__", ".env", "/dist/",
]


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = (
        data.get("tool_input", {}).get("file_path", "")
        or data.get("tool_input", {}).get("path", "")
    )

    if not file_path:
        sys.exit(0)

    _, ext = os.path.splitext(file_path)
    if ext not in SOURCE_EXTENSIONS:
        sys.exit(0)

    if any(p in file_path for p in SKIP_PATTERNS):
        sys.exit(0)

    rel = os.path.relpath(file_path) if os.path.isabs(file_path) else file_path
    print(
        f"[docs-hook] {rel} was modified. "
        "If this changes behaviour, API shape, or architecture, "
        "update README.md, CLAUDE.md, or the relevant file in specs/ accordingly."
    )


if __name__ == "__main__":
    main()
