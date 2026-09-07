# Legacy evaluator function guide

This file applies to `apps/function`.

## Purpose and boundaries

This app is the legacy HTTP evaluator used only when a problem has `legacy_evaluation: true`.
Current problems use the Redis protocol in `apps/backend/src/lib/evaluation_rs.ts` and require an
external evaluator consumer. Do not infer that a change here updates the current Redis evaluator.

`src/index.ts` exposes a single `POST /` endpoint. It validates a base64-encoded submission payload,
compiles or prepares the submitted program and optional checker, evaluates testcases, and returns
`EvaluationResult[]` from `@kontestis/models`.

## Code map and execution contract

- `src/compilers`: language-specific compiler command construction.
- `src/runners`: turns base64 source into runnable processes. Compiled artifacts and Python source
  are written under `/tmp`.
- `src/transformers`: converts compiler processes into success/error results.
- `src/recorders`: captures stdout, stderr, time, and memory, including interactive process wiring.
- `src/checkers`: prepares the checker input protocol.
- `src/evaluators`: maps process/checker outcomes to shared verdicts.

The HTTP implementation supports Python, C, C++, Java, Go, Rust, and output-only submissions. Shared
models also list GNU assembly and OCaml, but `GenericRunner` explicitly does not support them here.
Keep base64 boundaries straight: source/checker values arrive encoded, while testcase `in`/`out`
strings are UTF-8.

Checker stdout is a protocol. It recognizes `AC`/`accepted`, `WA`/`wrong_answer`, and
`custom:<data>`; backend scoring additionally interprets `custom:partial:<fraction>`. Changing
verdict names, units, skip behavior, compiler output, or checker output requires coordinated backend
and shared-model changes.

## Safety and verification

This service launches untrusted source using installed compilers and shell-backed child processes.
Run it in its purpose-built container, not directly on a workstation with valuable credentials or
data. Preserve resource/time limits and avoid broadening filesystem or network access. The
development image in `base.dockerfile` installs the same language toolchains used by production's
`.deploy/function.dockerfile`.

Run:

```sh
pnpm --filter @kontestis/function typecheck
pnpm lint
```

There is no evaluator test suite. For execution changes, manually cover compilation error, runtime
error, wrong answer, accepted, timeout, memory limit, skipped later testcases, custom checker, and
interactive behavior in the container. Clean-up/lifetime behavior for `/tmp` artifacts and child
processes is part of the change, even though the current implementation is minimal.
