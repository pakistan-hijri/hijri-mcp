# Style Guide

Project-wide rules applying to every milestone. This file covers how code
should read, not what it should do.

## 1. One concern per file

Each file holds one type, one adapter, or one clearly bounded piece of logic. If
you cannot name a file for what it does without reaching for “utils”, “helpers”,
or “common”, it holds more than one concern.

A type and the methods that belong to it are still one concern. The test is
whether a reader can describe the file’s job in one sentence without saying
“and”.

## 2. Placement before writing

Before adding code:

1. State the responsibility in one sentence.
2. Search for the module that already owns it; the module map is
   `specs/architecture.md` §6.
3. Match by responsibility, not by the file that happens to be open.
4. If nothing fits, create a module with a concrete name and a one-line
   responsibility docstring.

State the decision before writing: “Adding X to `path` because it owns Y.” If
the sentence needs an “and”, split the work.

## 3. Comments describe behaviour and intent

A comment says what the code accomplishes and why, especially when the reason is
not obvious. It must not restate operations the reader can already see.

Every module starts with a one-line responsibility docstring. That is the only
block comment allowed. No banners, ASCII rules, or section headers.

## 4. Prefer self-explanatory code

If a better name or clearer structure can carry the intent, do that instead of
writing a comment.

```ts
// Bad
if (now.getTime() >= maghrib.getTime()) { ... }

// Good
const afterMaghrib = now.getTime() >= maghrib.getTime();
if (afterMaghrib) { ... }
```

## 5. TypeScript shape

- Strict TypeScript, including `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, and
  `noFallthroughCasesInSwitch`.
- ESM only. Relative imports carry the `.js` extension.
- Named exports only. No default exports.
- No barrel files except a package’s public surface.
- Prefer `unknown` over `any`; narrow explicitly with a type guard or schema.
- Do not use `!` to silence the checker. Handle the missing case.
- Prefer plain functions and small types. Add a class only when it owns state or
  a lifetime (a cache, a client).
- Soft thresholds: 400 code lines per file, 50 lines per function, cyclomatic
  complexity 10, nesting depth 4.

## 6. Tests are part of the design

- Table-driven by default. `test.each` rows carry a behaviour name and fixed
  inputs.
- Deterministic and offline. Fake `fetch`, freeze the clock, use fixtures. No
  live API calls in unit tests.
- Regression tests. A bug fix includes a test that fails before the fix.
- Test files sit beside the code, named `<file>.test.ts`.

## 7. Inject what you depend on

A function takes what it needs — a `fetch` implementation, a clock, a config, a
cache — so a test can pass a fake. Reaching for global `fetch`, `Date.now()`, or
`process.env` inside logic makes behaviour untestable. Construction and wiring
belong in `src/index.ts`.

## 8. Errors and validation

- Validate untrusted external JSON at the boundary with zod. Trust the parsed
  type inward.
- Throw `AppError` with a stable code, a human message, and the original error as
  `cause`.
- Never discard the original error. Wrap with enough context to locate the
  failure.
- Expected bad input is an error to handle, not a crash. No `process.exit`
  inside domain, API, or tools; only `src/index.ts` decides process exit.
- A malformed API payload is a data error, not a stack trace in a tool result.

## 9. Naming and imports

- Export a type only when another module genuinely needs it.
- Name files after their responsibility: `rollover.ts`, `prayer-year.ts`, not
  `misc.ts`.
- Constants that mirror the external contract (profile ids, confidence values)
  live in one place and use the API’s spelling.
- Prefer direct imports over re-export layers.

## 10. Dependencies

The standard library comes first. Add a dependency only when it does something
the standard library genuinely cannot, and record the reason in
`specs/architecture.md`.

| Dependency | Why |
|---|---|
| `@modelcontextprotocol/server` | MCP server SDK and stdio transport |
| `zod` | Runtime validation of tool input and untrusted API JSON |

Dev dependencies (TypeScript, ESLint, Prettier, Vitest, MCP client) are tooling,
not runtime surface.

## 11. Output hygiene

- stdout carries only MCP protocol data. Diagnostics, warnings, and debug logs go
  to stderr.
- Never print secrets, tokens, or environment values in tool results.
- Error messages name the route or input and suggest the next action.

## 12. Security

- Treat API responses as hostile until zod has parsed them.
- Do not pass remote strings through a shell or interpret escape sequences.
- Tool input never becomes an arbitrary URL. City and profile are enums.
- Apply timeouts and response-size limits.
- No writes, telemetry, or secret handling.
