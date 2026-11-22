# 00 — Scaffolding

Milestone 00 is project hygiene, not product behaviour, so it has no
`requirements.md` and no `design.md`. This file is the checklist.

## 1. Repository files

- [x] `README.md` — description, install, host configs, tool reference,
      confidence/announcement semantics, environment variables, disclaimer.
- [x] `LICENSE` — MIT, copyright `Muhammad Shaheer`, year `2026`.
- [x] `CONTRIBUTING.md` — build/test commands, style and practice pointers.
- [x] `AGENTS.md` — tool-agnostic agent entry point.
- [x] `SECURITY.md` — supported versions, private reporting, scope.
- [x] `.gitignore` — `node_modules/`, `dist/`, coverage, build info, `.env`,
      logs, `reports/`, editor state.
- [x] `.github/workflows/ci.yml` — Node 20/22, lint, typecheck, test, build,
      `npm pack --dry-run`.

## 2. Package scaffold

- [x] `package.json` — ESM, `engines.node >=20`, `bin`, `files: ["dist"]`,
      scripts, MIT.
- [x] `tsconfig.json` — strict, NodeNext, no unchecked index access, exact
      optional properties.
- [x] `tsconfig.build.json` — emits `dist/` with declarations.
- [x] `eslint.config.mjs` — TypeScript ESLint, no console in `src` except
      stderr logger.
- [x] `vitest.config.ts` — Node environment, coverage optional.
- [x] `src/index.ts` — shebang and composition root stub.
- [x] `src/log.ts` — stderr-only logger.
- [x] `src/errors.ts` — stable codes and `AppError`.
- [x] `src/types.ts` — shared types.

## 3. Committed standards

- [x] `specs/architecture.md`
- [x] `specs/agent-practices.md`
- [x] `specs/style-guide.md`
- [x] Milestone specs for 01–05.

## 4. Exit criteria

- [x] `npm ci` succeeds.
- [x] `npm run lint`, `npm test`, `npm run build`, and `npm pack --dry-run`
      pass.
- [x] `reports/` exists locally but is not tracked by git.
- [x] No product behaviour exists in this milestone.
