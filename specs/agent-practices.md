# Agent practices

How work is done in this repository. These are project rules, not tool or
environment settings.

## 1. Read the spec before implementing

Each milestone is the design record: `requirements.md` (testable acceptance
criteria with stable IDs), `design.md` (rationale, interfaces, failure modes),
and `tasks.md` (the checklist, each task citing requirement IDs). Implement
against the spec, not against a guess.

Milestones build in order. A later design may reference an earlier one; an
earlier one never depends on a later one.

## 2. Do not silently resolve an open decision

Every `design.md` ends with a numbered `OD-xx` list. Surface choices the project
owner reserved; do not pick a value you cannot justify. When one is decided,
record the resolution and reasoning in the design.

## 3. Ask when implementation demands it

If a task needs a decision the spec does not make, ask. Guessing produces work
that has to be undone.

## 4. Commits

- Small, focused commits along the way, not one large commit at the end.
- Labelled messages: `feat`, `fix`, `chore`, `docs`, `test`, with an optional
  scope, e.g. `feat(api): …`.
- One concern per commit; each commit should build and pass tests.
- No `Co-authored-by` trailers for agents or tooling.

## 5. Every milestone run leaves a report

A development run is not finished until its report exists in `reports/`.
Reports are scoped to milestones, not collected in one progress file:

```text
reports/<milestone>/<run>.md
```

For example, `reports/00-scaffolding/2026-11-21.md` and
`reports/01-api-client/2026-11-21.md`. A report records what was built, how it
is shaped, how to run and test it, live validation, and known gaps.
`reports/` is gitignored.

## 6. Validate against the real API

Green unit tests are necessary but not sufficient. Drive the built server
against `https://pakistan-hijri.github.io/hijri-api` at least once: a confirmed
date, an awaiting date, a Ramadan date, and a prayer result. Record the commands
and results in the run report.

## 7. Report status honestly

The README describes intended scope. What exists versus what is still a gap
belongs in the run report. Never describe a capability as achieved when a later
milestone owns it.

## 8. Change as little as the spec requires

Make the smallest change that satisfies the requirement. Do not add features,
configurability, or abstractions the task did not ask for. Delete unused code
rather than leaving compatibility shims.

## 9. Respect the boundaries

`index → server → tools → domain`, with `api` as an adapter.

- `api` validates and returns typed data; it does not format or decide policy.
- `domain` is pure; it does not fetch, read files, read env, or print.
- `tools` compose API and domain; they own the public result envelope.
- `server` owns MCP registration only.
- `index` owns wiring.

Two invariants are load-bearing:

1. **stdout carries only MCP protocol data.** Diagnostics go to stderr.
2. **The server never invents date or prayer data.** It reads the published
   `hijri-api` contract and surfaces its confidence.

## 10. Leave the build green

Before considering work done: `npm run lint`, `npm test`, `npm run build`, and
`npm pack --dry-run` all pass. Run them yourself; do not rely on CI to catch a
failure you could have seen locally.

## 11. Refactoring

Pin behaviour with tests, extract one module at a time, run the tests, and keep
refactoring separate from behaviour changes. Never weaken a failing test to make
a refactor pass, and do not add an abstraction for a hypothetical third case.
