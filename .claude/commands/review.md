---
description: Review the current branch's changes — code quality, conventions, and spec compliance
---

Review all changes on the current branch against `main`. If `$ARGUMENTS` is provided, treat it as a PR number or branch name to review instead.

## Steps

1. **Get the diff**
   ```
   git diff main...HEAD
   git log main..HEAD --oneline
   ```

2. **Code quality checks**

   **TypeScript (`apps/api/`)**
   - Handlers are thin: validate input → delegate → return response; no business logic
   - All domain types imported from `@gen-ai/shared`, never duplicated inline
   - No direct calls to Python or shell scripts
   - Input validated at the boundary; no unchecked `.body` access passed downstream

   **Python (`services/rag-service/`)**
   - All I/O functions are `async`
   - Pydantic models used for all request/response shapes
   - `MOCK_*` env vars respected — no Bedrock/S3 calls bypass mock gates
   - No business logic in `main.py`

   **CDK (`infra/cdk/`)**
   - IAM roles follow least-privilege (no `*` actions unless justified)
   - Environment variables injected via CDK, not hardcoded
   - Removal policies are intentional (not accidental `DESTROY` on prod resources)

3. **Spec compliance** — delegate to the `spec-guardian` agent with a summary of the changed files

4. **Test coverage** — are the changed code paths covered by tests? Flag any untested public functions or new routes.

5. **Conventions**
   - Branch name follows `feat(<spec>):` / `fix(<spec>):` convention
   - Commit messages match the branch convention
   - No debug logs, console.log, or print statements left in

## Output format

```
## Code Review: <branch-name>

### Summary
<1-2 sentences on what this change does>

### Commits
<list from git log>

### Issues

#### MUST FIX
- <blocker — wrong behaviour, spec violation, security issue>

#### SHOULD FIX
- <non-blocking quality issue>

#### NITPICK
- <style, naming, minor improvement>

### Spec Compliance
<paste spec-guardian report here>

### Verdict
APPROVE / REQUEST CHANGES — <one sentence reason>
```

Be specific: cite file:line for every issue raised.
