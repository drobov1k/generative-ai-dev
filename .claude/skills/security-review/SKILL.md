---
name: security-review
description: This skill should be used when the user asks to "security review", "check for security issues", "audit security", "review for vulnerabilities", "is this secure", "check IAM permissions", "check for injection vulnerabilities", or wants a security audit of pending changes before merging.
version: 0.1.0
---

# Security Review

Perform a security-focused audit of all changes on the current branch relative to `main`. Only flag issues present in the actual diff — do not audit unchanged code.

## When to Use

Trigger on: "security review", "check for vulnerabilities", "audit security", "is this secure", "check IAM", "review for injection".

## Process

### 1. Get the diff

```bash
git diff main...HEAD
```

### 2. Assess each changed file against the threat model

**API layer (`apps/api/`)**
- **Input validation** — user-supplied values validated (type, length, allowed characters) before use? Unvalidated input reaching Lambda env vars, S3 keys, or DynamoDB is an injection risk.
- **Authentication** — every new or modified route enforces auth? Cognito claims checked before acting on user-scoped data?
- **Error responses** — error handlers leak stack traces, internal paths, or AWS account IDs to callers?

**RAG service (`services/rag-service/`)**
- **Prompt injection** — user-supplied text flows into prompts without sanitisation? Can a user override system-prompt instructions via crafted input?
- **Path traversal** — file paths derived from user input sanitised before S3 key construction or local file access?
- **Deserialization** — untrusted payloads parsed with Pydantic (safe) or raw `json.loads`/`pickle` (risky)?
- **Secrets** — API keys or credentials read from env vars, never hardcoded or written to logs?
- **Mock bypass** — new code paths skip `MOCK_*` guards, potentially calling Bedrock/S3 in test environments?

**Infrastructure (`infra/cdk/`)**
- **IAM least-privilege** — new IAM statements use specific actions and resources, not `*:*`?
- **Public exposure** — new S3 buckets private by default (`blockPublicAccess`)? New API GW routes protected?
- **Secrets management** — secrets in `SecretValue`/SSM, not plaintext in stack parameters?
- **Removal policy** — `RemovalPolicy.DESTROY` intentional for any new stateful resources?

**Cross-cutting**
- **Logging** — sensitive values (tokens, PII, raw user queries) written to CloudWatch?
- **CORS** — new CORS policies overly permissive (`*` origin on credentialed endpoints)?
- **Dependencies** — diff updates packages? New versions known-vulnerable?

## Output Format

```
## Security Review: <branch-name>

### Critical (must fix before merge)
- <issue> — <file:line> — <recommended fix>

### High (strong recommendation to fix)
- <issue> — <file:line> — <recommended fix>

### Medium / Informational
- <issue> — <file:line> — <recommended fix>

### Clean areas
- <areas checked with no issues found>

### Verdict
PASS / PASS WITH NOTES / BLOCK — <one sentence>
```

Cite the exact file and line for every finding. Note what additional context would clarify ambiguous findings.

## Additional Resources

- **`references/threat-model.md`** — full threat model for this stack (API GW, Lambda, Bedrock, S3, Cognito)
