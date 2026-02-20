## /issue-plan

### description

Create plan from research artifact.
This command is for planning only. **Do NOT implement any code changes at this stage.**

### Session Rule

- Ignore all previous context
- Use ONLY:
  .claude/artifacts/issue-{id}/research.md
- If not exists -> STOP and ask to run /issue-research

### instructions

1. Load research.md
2. Analyze impact
3. Create small tasks
4. Clearly document scope and boundaries
5. **Do NOT modify any source files**
6. **Do NOT generate implementation code**
7. **Do NOT apply fixes**
8. Planning and task decomposition only

Output to:
.claude/artifacts/issue-{id}/plan.md

# Plan Artifact

## Scope

- Define what will be changed
- Define what will NOT be changed
- No implementation decisions beyond high-level design
- No code writing

## Impacted Layers

- presentation
- usecase
- domain
- infrastructure

## File Changes

- List expected files to be modified (no actual edits)

## Risks

- Technical risks
- Architectural risks
- Migration risks

## Tasks

1.
2.
3.
4.
