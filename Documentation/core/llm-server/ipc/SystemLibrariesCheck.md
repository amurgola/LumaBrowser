# SystemLibrariesCheck

`core/llm-server/ipc/SystemLibrariesCheck.js`

The Linux system-library preflight both setup wizards run before a model download.

## Methods

- `new SystemLibrariesCheck({ llmServerService, deps, sysdeps?, log? })`; `deps` is
  [LlmIpcDeps](LlmIpcDeps.md) (for the image server), `sysdeps` defaults to `new SysdepsChecker()`.
- `check()` resolves `{ result }`: `SysdepsChecker#preflight({ binaries })` over every
  installed LLM and image runtime binary, without `rawLog`. A missing library is
  logged with the raw loader output. A service whose runtimes view fails still
  gets the known-set check. Always ok off Linux.

## Why

Loader output is for the log, never for a renderer; the user gets a plain
sentence and a copyable apt line.
