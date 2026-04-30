---
name: review
description: This skill should be used when the user asks to "review my code", "review this branch", "review the PR", "review changes", "do a code review", "check my implementation", or wants feedback on code quality, conventions, or spec compliance before merging.
version: 0.1.0
---

# Code Review

Review all changes on the current branch against `main` for code quality, convention adherence, and spec compliance.

## When to Use

Trigger on: "review my code", "review this PR", "review the branch", "check my changes", "do a code review".

## Process

### 1. Get the diff

```bash
git diff main...HEAD
git log main..HEAD --oneline
```

### 2. Code quality checks

**TypeScript (`apps/api/`)**
- Handlers are thin: validate input → delegate → return response; no business logic inline
- All domain types imported from `@gen-ai/shared`, never duplicated
- No direct calls to Python scripts or shell from TS handlers
- Input validated at system boundary; no unchecked `.body` fields passed downstream

**Python (`services/rag-service/`)**
- All I/O functions are `async`
- Pydantic models used for all request/response shapes
- `MOCK_*` env vars respected — no Bedrock/S3 calls that bypass mock gates
- No business logic in `main.py`

**CDK (`infra/cdk/`)**
- IAM roles follow least-privilege (no `*` actions unless justified in a comment)
- Environment variables injected via CDK, not hardcoded in stack
- Removal policies are intentional (`DESTROY` on stateful resources must be explicit)

### 3. Spec compliance

Delegate to the `spec-guardian` agent with the list of changed files and a summary of what changed. Include the full report in output.

### 4. Test coverage

Flag any new public functions, new API routes, or changed logic that has no corresponding test.

### 5. Conventions check

- Branch name follows `feat(<spec>):` / `fix(<spec>):` convention
- Commit messages match the branch convention
- No leftover debug statements (`console.log`, `print(`, `pdb`, `breakpoint()`)

## Output Format

```
## Code Review: <branch-name>

### Summary
<1-2 sentences on what this change does>

### Commits
<list from git log>

### Issues

#### MUST FIX
- <file:line> — <issue>

#### SHOULD FIX
- <file:line> — <issue>

#### NITPICK
- <file:line> — <issue>

### Spec Compliance
<spec-guardian report>

### Verdict
APPROVE / REQUEST CHANGES — <one sentence reason>
```

Cite file:line for every issue raised.

## Additional Resources

- **`references/conventions.md`** — TypeScript and Python conventions specific to this project
