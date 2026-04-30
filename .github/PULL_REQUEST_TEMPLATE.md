## What

<!-- One paragraph: what does this PR do? -->

## Why

<!-- Why is this change needed? Link to a spec, issue, or decision. -->

## Spec alignment

<!-- Does this change touch the API contract, domain model, or prompt spec?
     If yes, confirm the relevant spec file was updated first. -->

- [ ] No spec files affected
- [ ] `specs/openapi.yaml` updated
- [ ] `specs/domain.yaml` updated
- [ ] `specs/rag-pipeline.md` updated
- [ ] `specs/prompts.yaml` updated

## Checklist

- [ ] CI passes (Python syntax/tests + TS typecheck)
- [ ] `MOCK_EMBEDDINGS=true` / `MOCK_GENERATION=true` paths still work
- [ ] No TypeScript code calls Python code directly
