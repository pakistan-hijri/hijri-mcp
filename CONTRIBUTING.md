# Contributing

Read `specs/agent-practices.md` before making changes. It defines the report
format, validation requirements, and commit discipline for this repository.

## Development loop

1. Pick the current milestone in `specs/` and read its `requirements.md`,
   `design.md`, and `tasks.md`.
2. Keep changes inside that milestone where practical.
3. Add or update tests with the change.
4. Run `npm run lint`, `npm test`, and `npm run build`.
5. Write a milestone-scoped report under `reports/<milestone>/<run>.md`.
6. Commit with a Conventional Commits message.

## Rules

- Use injectable dependencies for HTTP, time, and logging.
- Never write to stdout except through the MCP SDK.
- Never log secrets or full request URLs with credentials.
- Do not add a runtime dependency on `hijri-cli`.
- Do not cache stale API data.
