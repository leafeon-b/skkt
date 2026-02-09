## /issue-implement

### description

Implement based on approved plan without interactive confirmation.

### Session Rule

- Stateless start
- Use ONLY:
  .claude/artifacts/issue-{id}/plan.md
- If not exists -> STOP

### instructions

1. Load plan.md
2. Execute ALL tasks sequentially to completion
3. Apply minimal necessary changes only
4. Record implementation log

Process requirements:

- NO interactive confirmation during execution
- Follow the plan strictly
- Keep changes minimal and atomic
- Rely on Claude default guardrails for safety decisions

### Rules

- no unrelated refactor
- no new library without justification
- keep existing architecture
- preserve coding style

Output to:
.claude/artifacts/issue-{id}/implement-log.md
