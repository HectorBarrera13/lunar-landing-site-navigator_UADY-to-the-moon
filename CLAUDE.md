@AGENTS.md

## Claude Code specifics

- When working inside a workspace, also follow its rules: @apps/frontend/AGENTS.md · @apps/backend/AGENTS.md · @pipeline/AGENTS.md
- Use plan mode (`/plan`) for any task that touches more than one file or crosses a workspace boundary. Show the plan, including the files you will touch, before editing.
- Role-scoped subagents live in `.claude/agents/`. Delegate work to the subagent that owns the target folder (see the Ownership map in `AGENTS.md`). A subagent must not edit files outside its scope; if the task needs that, it stops and reports back.
- Before reporting a task as done, run the workspace's Definition of Done commands and update `AI_LOG.md`.
