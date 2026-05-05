# AGENTS.md

## Auto-Commit Rule
After every code change, automatically create a git commit with a descriptive message summarizing what was done and why. Follow these rules:
- Commit message format: `<type>: <brief summary>` (e.g., `fix: resolve silent generation failure in Write.jsx`)
- Include relevant file paths and a one-line explanation in the commit body if the change is non-trivial
- Run `git status` after committing to verify success
- NEVER commit changes unless the user explicitly asks you to — except for this auto-commit rule, which applies to all code changes made during this session
