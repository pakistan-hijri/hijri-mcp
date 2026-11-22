# 05 — Docs and Release: Tasks

## 1. Package metadata

- [ ] Set package name, version, description, license, ESM, `bin`, `files`, and
      engines. (`REL-PKG-1`–`REL-PKG-3`)
- [ ] Verify `npx -y hijri-mcp` starts the server. (`REL-PKG-4`)
- [ ] Confirm no `hijri-cli` dependency. (`REL-PKG-5`)

## 2. README

- [ ] Write what-it-is / what-it-is-not section. (`REL-DOC-1`)
- [ ] Add Claude Desktop, Cursor, and VS Code configs. (`REL-DOC-2`)
- [ ] Document all four tools. (`REL-DOC-3`)
- [ ] Document confidence, announcement, coverage, and Maghrib. (`REL-DOC-4`)
- [ ] Document environment variables and prayer disclaimer. (`REL-DOC-5`)
- [ ] Document awaiting-announcement rule. (`REL-DOC-6`)

## 3. CI and release

- [ ] Add Node 20/22 CI with lint, typecheck, test, build, pack dry run.
      (`REL-CI-1`, `REL-CI-2`)
- [ ] Add release workflow with provenance. (`REL-CI-3`, `REL-CI-4`)

## 4. Reports

- [ ] Create `reports/<milestone>/` and add `reports/` to `.gitignore`.
      (`REL-REP-1`, `REL-REP-2`)
- [ ] Write one report per milestone run with validation commands and gaps.
      (`REL-REP-3`, `REL-REP-4`)

## 5. Exit criteria

- [ ] `npm pack --dry-run` contains only intended files.
- [ ] README examples match the implemented schemas.
- [ ] CI workflow is valid YAML.
- [ ] Reports directory is untracked.
