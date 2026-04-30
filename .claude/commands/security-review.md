---
description: Security review of the pending changes on the current branch
---

Perform a security review of all changes on the current branch relative to `main`.

```
git diff main...HEAD
```

Assess each changed file against the threat model below. Only flag issues relevant to the actual diff — do not audit unchanged code.

## Threat model for this stack

### API layer (`apps/api/`)
- **Input validation** — are all user-supplied values validated (type, length, allowed characters) before use? Unvalidated input reaching Lambda env vars, DynamoDB keys, or S3 paths is an injection risk.
- **Authentication / authorisation** — does every new or modified route enforce auth? Are Cognito claims checked before acting on user-scoped data?
- **Error responses** — do error handlers leak stack traces, internal paths, or AWS account details to callers?
- **Dependency confusion** — any new `npm install` adding packages with unusual names or from untrusted registries?

### RAG service (`services/rag-service/`)
- **Prompt injection** — does user-supplied text flow into prompts without sanitisation? Can a user override system-prompt instructions via crafted input?
- **Path traversal** — are file paths derived from user input sanitised before S3 key construction or local file access?
- **Deserialization** — are untrusted payloads parsed with Pydantic (safe) or raw `json.loads` / `pickle` (risky)?
- **Environment secrets** — are API keys / credentials read from env vars, never hardcoded or logged?
- **Mock bypass** — do any new code paths skip `MOCK_*` guards, potentially calling Bedrock/S3 in test environments?

### Infrastructure (`infra/cdk/`)
- **IAM least-privilege** — do new IAM statements use specific actions and resources, not `*:*`?
- **Public exposure** — are new S3 buckets private by default (`blockPublicAccess`)? Are new API GW routes protected?
- **Secrets management** — are secrets in `SecretValue` / SSM Parameter Store, not plaintext in stack parameters?
- **Removal policy** — is `RemovalPolicy.DESTROY` intentional for any new stateful resources?
- **VPC / network** — do new Lambdas that need network access have appropriate security groups?

### Cross-cutting
- **Logging** — are any sensitive values (tokens, PII, raw user queries) written to CloudWatch?
- **CORS** — are any new CORS policies overly permissive (`*` origin on credentialed endpoints)?
- **Dependency updates** — does the diff update packages? Are any of the new versions known-vulnerable?

## Output format

```
## Security Review: <branch-name>

### Critical (must fix before merge)
- <issue> — <file:line> — <recommended fix>

### High (strong recommendation to fix)
- <issue> — <file:line> — <recommended fix>

### Medium / Informational
- <issue> — <file:line> — <recommended fix>

### No issues found in
- <areas that were checked and are clean>

### Verdict
PASS / PASS WITH NOTES / BLOCK — <one sentence>
```

Cite the exact file and line for every finding. If a finding is ambiguous without more context, note what additional information would clarify it.
