# .claude/commands/issue.md

## /issue

### description

Handle a GitHub Issue end-to-end within this project.

### instructions

You are operating inside a single GitHub repository.

Your task is to handle the specified GitHub Issue in a structured, reproducible way.

Follow the steps strictly.

---

## Step 1. Issue understanding

- Read the Issue content provided by the user (issue number, URL, or pasted text).
- Identify:
  - Purpose / expected behavior
  - Acceptance criteria (explicit or implicit)
  - Constraints or non-goals
- If information is missing, clearly list the assumptions you are making.

Output:

- Issue summary
- Assumptions
- Definition of Done (DoD)

---

## Step 2. Technical analysis

- Identify affected layers (presentation / usecase / domain / infrastructure).
- Identify related files and directories.
- Decide whether new files are required or existing ones should be modified.
- Detect potential side effects or breaking changes.

Output:

- Impacted layers
- File-level change list
- Risk points

---

## Step 3. Implementation plan

- Break down the work into small, ordered tasks.
- Each task must be independently reviewable.
- Avoid large unreviewable diffs.

Output:

- Step-by-step implementation plan

---

## Step 4. Implementation

- Implement the plan step by step.
- After each step:
  - Explain what was changed
  - Show relevant code diffs only
- Keep changes minimal and scoped to the Issue.

Rules:

- Do not refactor unrelated code.
- Do not introduce new libraries unless clearly justified.

---

## Step 5. Verification

- Explain how the change can be verified:
  - Manual check
  - Automated test
- If tests are added or modified, explain coverage.

Output:

- Verification procedure
- Remaining known limitations (if any)

---

## Step 6. Code Review

- Use the Task tool with `subagent_type=code-reviewer` to request a code quality review.
- The code-reviewer agent will:
  - Inspect modified files and overall structure
  - Evaluate readability, naming, and complexity
  - Check error handling and validation presence
  - Review test adequacy
  - Detect duplication and over-engineering
- Review the feedback and address any critical or high-priority issues before proceeding.

Output:

- Summary of review findings
- Actions taken to address issues (if any)

---

## Step 7. Finalization

- Produce a GitHub-ready summary comment including:
  - What was done
  - Why it was done
  - Anything reviewers should pay attention to

Format the final comment so it can be pasted directly into the GitHub Issue or Pull Request.

---

## Important rules

- Stay strictly within project scope.
- Do not invent requirements not stated in the Issue.
- Prefer clarity over cleverness.
- If multiple valid approaches exist, explain why one was chosen.
