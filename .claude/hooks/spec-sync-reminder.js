#!/usr/bin/env node
// PostToolUse hook — after editing a spec file, reminds which implementation to sync.

const path = require("path");

const REMINDERS = {
  "specs/openapi.yaml":
    "[spec-sync] openapi.yaml changed — verify handler stubs in apps/api/src/handlers/ still match the contract.",
  "specs/domain.yaml":
    "[spec-sync] domain.yaml changed — sync packages/shared/src/types/index.ts with the updated domain model.",
  "specs/prompts.yaml":
    "[spec-sync] prompts.yaml changed — treat this like a code change and review the prompt diff before committing.",
};

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

  const rel = filePath.startsWith("/")
    ? path.relative(process.cwd(), filePath)
    : filePath;

  const message = REMINDERS[rel];
  if (message) console.log(message);

  process.exit(0);
});
