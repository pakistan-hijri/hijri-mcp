# 05 — Docs and Release: Design

## 1. Rationale

The package is only useful if a user can add it to an MCP host without reading
the source. The README is the product surface; the release workflow makes the
published artifact reproducible.

## 2. Package shape

```json
{
  "name": "hijri-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": { "hijri-mcp": "dist/index.js" },
  "files": ["dist"],
  "engines": { "node": ">=20" },
  "license": "MIT"
}
```

Build with `tsc`. Preserve the shebang in `src/index.ts` and verify
`dist/index.js` is executable after build. `npm pack --dry-run` must list only
the intended files.

## 3. Host configuration

Claude Desktop:

```json
{
  "mcpServers": {
    "hijri": {
      "command": "npx",
      "args": ["-y", "hijri-mcp"]
    }
  }
}
```

Cursor `.cursor/mcp.json` or `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hijri": {
      "command": "npx",
      "args": ["-y", "hijri-mcp"]
    }
  }
}
```

VS Code `.vscode/mcp.json`:

```json
{
  "servers": {
    "hijri": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "hijri-mcp"]
    }
  }
}
```

Optional environment:

```json
{
  "env": {
    "HIJRI_API_BASE_URL": "https://pakistan-hijri.github.io/hijri-api"
  }
}
```

## 4. README outline

1. What it is and what it is not.
2. Quick start with `npx`.
3. Host configuration examples.
4. Tool reference.
5. Date, confidence, and announcement semantics.
6. Prayer times and Ramadan.
7. Environment variables.
8. Privacy and security.
9. Accuracy disclaimer.
10. Development commands and links to `specs/`.

## 5. CI

```yaml
strategy:
  matrix:
    node: [20, 22]
steps:
  - npm ci
  - npm run lint
  - npm run typecheck
  - npm test
  - npm run build
  - npm pack --dry-run
```

## 6. Release

- Tag `v*`.
- GitHub Actions with `id-token: write`.
- npm trusted publishing/provenance.
- `npm publish --access public --provenance`.
- Release notes: four tools, coverage caveat, no `hijri-cli` dependency.

## 7. Reports

`reports/` is gitignored. Reports are scoped to milestones:

```text
reports/<milestone>/<run>.md
```

For example, `reports/00-scaffolding/2026-11-21.md`. Do not maintain one shared
`progress.md`. Each run report records:

- what was built,
- commands run and results,
- live API smoke results,
- known gaps,
- next milestone.

## 8. Open decisions

- **OD-05-1 — README examples.** Resolved: include all three hosts.
- **OD-05-2 — Release automation.** Resolved: GitHub Actions with provenance.
- **OD-05-3 — Version.** Resolved: `0.1.0` for the first public build.
