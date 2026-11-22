# Agent notes

Start with `specs/agent-practices.md`. Then read `specs/architecture.md`,
`specs/style-guide.md`, and the current milestone's three spec files.

## Commands

```bash
npm run lint
npm test
npm run build
```

## Non-negotiables

- One concern per file.
- Inject fetch, clock, logger, and cache where used.
- Stdout is reserved for MCP; all logs go to stderr.
- Reports are milestone-scoped: `reports/<milestone>/<run>.md`.
- No runtime dependency on `hijri-cli`.
