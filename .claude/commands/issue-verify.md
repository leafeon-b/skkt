## /issue-verify

### description

Verification and intent-based review orchestration.

### Session Rule

- Start stateless
- Use ONLY artifacts:
  - .claude/artifacts/issue-{id}/research.md
  - .claude/artifacts/issue-{id}/plan.md
  - .claude/artifacts/issue-{id}/implement-log.md
- If any missing -> STOP and request required phase.

---

## Review Intent Model

This command works with REVIEW INTENTS only.
Do NOT assume concrete subagent names.

Supported intents:

- safety
- design
- implementation

Agent resolution is an external responsibility.

---

## Intent Inference Rules (rule-based)

Infer intents from artifacts:

### safety

IF changes include:

- authentication / authorization
- input validation
- permissions
- personal data handling
- external I/O

### design

IF changes include:

- layer boundary modification
- domain model change
- public API change
- cross-module dependency

### implementation

IF changes include:

- business logic
- refactoring
- performance
- error handling

Multiple intents are allowed.

If inference result is empty or ambiguous:
ASK USER:

"Select review intents (multiple allowed):

- safety
- design
- implementation"

---

## Review Execution (serial)

For each inferred intent in order:

1. Resolve concrete agent externally.
2. Call Task tool:

subagent_type = <resolved agent>

Instructions to subagent:

- inspect modified files
- evaluate according to intent
- report issues by severity
- suggest minimal fixes

3. Collect result before next intent.

---

## Verification

1. Describe manual verification steps.
2. Describe automated test confirmation.

---

## Output

Write to:
.claude/artifacts/issue-{id}/verify.md

Structure:

# Verify Artifact

## Intents Used

## Verification Procedure

## Review Results

### [intent]

- findings
- applied fixes

## Remaining Limitations

---

## Improvement Issue Creation

After all reviews complete, create GitHub issues from improvement suggestions.

### Scope

Target findings that are:

- NOT blocking the current PR (blocking issues should be fixed in-place)
- Worth tracking as separate work items
- Appropriately scoped (one concern per issue)

If no such findings exist, skip this phase.

### Granularity Rules

- One issue per distinct improvement suggestion
- Do NOT bundle unrelated findings into a single issue
- If a finding spans multiple files but is one concern, create one issue
- If a finding contains multiple independent concerns, split into separate issues

### Labeling

Each issue MUST have exactly TWO labels: one type label and one priority label.

#### Type Labels (select one)

| Label               | When to use                                |
| ------------------- | ------------------------------------------ |
| `bug`               | Incorrect behavior or defect found         |
| `enhancement`       | New feature or functional improvement      |
| `documentation`     | Documentation additions or corrections     |
| `type: security`    | Security vulnerability or hardening        |
| `type: testing`     | Test coverage addition or test improvement |
| `type: ui/ux`       | UI/UX design or usability improvement      |
| `type: refactoring` | Code structure, readability, architecture  |

#### Priority Labels (select one)

| Label              | Criteria                                               |
| ------------------ | ------------------------------------------------------ |
| `priority: high`   | Security risk, data integrity, or user-facing breakage |
| `priority: medium` | Code quality, maintainability, or moderate UX impact   |
| `priority: low`    | Minor style, nice-to-have, or low-impact improvement   |

### Execution

1. Collect all improvement suggestions from review results.
2. If a suggestion is minor and can be safely fixed without changing design, architecture, or external behavior, apply the fix immediately instead of creating an issue. Clearly report what was changed and why.
3. Group and deduplicate across intents (e.g., same concern found by both safety and implementation reviewers), excluding already fixed items.
4. For each distinct remaining suggestion, draft:
   - **Title**: concise, imperative form (e.g., "Add input validation to match creation endpoint")
   - **Body**: context, what was found, why it matters, suggested approach (if any)
   - **Labels**: one type + one priority
5. Present the list of proposed issues to the user for approval.
6. After approval, create issues via `gh issue create`.

### Output Addition

Append to verify.md:

## Created Issues

| #        | Title   | Labels             |
| -------- | ------- | ------------------ |
| {number} | {title} | {type}, {priority} |
