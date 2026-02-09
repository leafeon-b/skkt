## /issue-finalize

### description

Publish implementation results to GitHub workflow.

### Session Rule

- Stateless start
- Use ONLY verify.md results and current changes

### instructions

1. Create working branch
   - name: issue/{id}-{slug}

2. Commit changes
   - atomic commits
   - follow conventional commits
   - reference issue id

3. Push branch

4. Create Pull Request
   - link to issue
   - include verification steps

5. If remaining tasks exist
   - create follow-up issue

### Standard Output

Print to STDOUT:

- What was done
- Why
- How to verify
- Points to review

### Notes

- Do NOT modify code during this step
- Artifacts are logs only, source of truth is GitHub
