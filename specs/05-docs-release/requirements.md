# 05 — Docs and Release: Requirements

## 1. Purpose

Make `hijri-mcp` installable, understandable, and releasable as `v0.1.0`.

## 2. Scope

**In scope**

- README with install, host configs, tool reference, and semantics.
- Package metadata and `npx` behavior.
- CI matrix and package dry run.
- Release workflow with npm provenance.
- Security and contributing docs.
- Progress reports in gitignored `reports/`.

**Out of scope**

- New product behavior.
- Hosted HTTP transport.
- A shared API client package.

Requirement IDs use `REL-<AREA>-<n>`.

## 3. Functional requirements

### 3.1 Package

- **REL-PKG-1** — THE PACKAGE SHALL be named `hijri-mcp`, ESM, MIT, with
  `engines.node >=20`.
- **REL-PKG-2** — THE PACKAGE SHALL expose `bin.hijri-mcp = dist/index.js`.
- **REL-PKG-3** — THE PACKAGE SHALL publish only `dist/` and required metadata.
- **REL-PKG-4** — `npx -y hijri-mcp` SHALL start the stdio server.
- **REL-PKG-5** — THE PACKAGE SHALL have no runtime dependency on `hijri-cli`.

### 3.2 README

- **REL-DOC-1** — README SHALL state what the server is, what it is not, and that
  `hijri-api` is the source of truth.
- **REL-DOC-2** — README SHALL include Claude Desktop, Cursor, and VS Code
  configuration examples.
- **REL-DOC-3** — README SHALL document all four tools and their inputs.
- **REL-DOC-4** — README SHALL document confidence, announcement, coverage, and
  Maghrib semantics.
- **REL-DOC-5** — README SHALL document environment variables and the prayer
  disclaimer.
- **REL-DOC-6** — README SHALL state that dates after `confirmed_through` are
  awaiting announcement and must not be presented as confirmed.

### 3.3 CI and release

- **REL-CI-1** — CI SHALL run on Node 20 and 22.
- **REL-CI-2** — CI SHALL run lint, typecheck, test, build, and
  `npm pack --dry-run`.
- **REL-CI-3** — Release SHALL run on `v*` tags with npm provenance.
- **REL-CI-4** — Release SHALL require `id-token: write` and trusted
  publishing.

### 3.4 Reports

- **REL-REP-1** — Development reports SHALL live in
  `reports/<milestone>/<run>.md`, one report per milestone run.
- **REL-REP-2** — `reports/` SHALL be gitignored.
- **REL-REP-3** — Reports SHALL record what was built, validation commands, and
  known gaps.
- **REL-REP-4** — Reports SHALL NOT be consolidated into a single progress file.

## 4. Non-functional requirements

- **REL-NFR-1** — Documentation SHALL match the implemented schemas.
- **REL-NFR-2** — No secrets SHALL be committed.
- **REL-NFR-3** — Release notes SHALL describe the tool surface and any coverage
  caveats.

## 5. Traceability

Tasks are in `tasks.md`; package and release rationale is in `design.md`.
