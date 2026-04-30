#!/usr/bin/env node
// PostToolUse hook — fires after Edit or Write.
// If a source code file was changed, reminds Claude to check whether
// README.md, CLAUDE.md, or specs/ need updating.

const SOURCE_EXTENSIONS = new Set([".py", ".ts", ".tsx", ".js", ".jsx"]);

const SKIP_PATTERNS = [
  "README", "CLAUDE", "/specs/", "/.claude/",
  "node_modules", "__pycache__", ".env", "/dist/",
];

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath =
    data?.tool_input?.file_path ||
    data?.tool_input?.path ||
    "";

  if (!filePath) process.exit(0);

  const ext = filePath.slice(filePath.lastIndexOf("."));
  if (!SOURCE_EXTENSIONS.has(ext)) process.exit(0);

  if (SKIP_PATTERNS.some((p) => filePath.includes(p))) process.exit(0);

  const rel = filePath.startsWith("/")
    ? require("path").relative(process.cwd(), filePath)
    : filePath;

  console.log(
    `[docs-hook] ${rel} was modified. ` +
    "If this changes behaviour, API shape, or architecture, " +
    "update README.md, CLAUDE.md, or the relevant file in specs/ accordingly."
  );
});
