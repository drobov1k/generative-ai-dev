#!/usr/bin/env node
// PreToolUse hook — blocks Claude from reading real .env files via Read or Bash.
// .env.example is always allowed.

const path = require("path");

const BLOCK_MESSAGE =
  "[env-guard] Blocked: real .env files may contain secrets. " +
  "Use .env.example for reference or ask the user to share specific values.";

function isRealEnvFile(filePath) {
  const name = path.basename(filePath);
  return (name === ".env" || name.startsWith(".env.")) && name !== ".env.example";
}

// Matches .env access in shell commands: cat .env, head .env, etc.
// Catches: cat .env, cat path/to/.env, cat .env.local — but not .env.example
const BASH_ENV_RE = /(?:^|\s|\/)(\.env(?:\.[a-zA-Z0-9_-]+)?)(?:\s|$|"|')/;

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

  const toolName = data?.tool_name ?? "";
  const input = data?.tool_input ?? {};

  if (toolName === "Read") {
    const filePath = input.file_path || input.path || "";
    if (filePath && isRealEnvFile(filePath)) {
      console.log(`${BLOCK_MESSAGE} (file: ${filePath})`);
      process.exit(2);
    }
  }

  if (toolName === "Bash") {
    const command = input.command || "";
    const match = command.match(BASH_ENV_RE);
    if (match) {
      const envFile = match[1];
      if (envFile !== ".env.example") {
        console.log(`${BLOCK_MESSAGE} (command contains: ${envFile})`);
        process.exit(2);
      }
    }
  }

  process.exit(0);
});
