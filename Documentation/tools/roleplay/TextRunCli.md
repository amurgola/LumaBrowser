# TextRunCli

`tools/roleplay/TextRunCli.js`

Runs the Roleplay Lab's scripted text playthrough against a real model from the terminal: `npm run rp:text -- [options]` (`scripts/rp-text-run.js`).

## Options

- `--base-url <url>` an OpenAI-compatible base that is already up (default
  `http://127.0.0.1:8317/v1`, the app's Local API); the router's local path
  talks to its host and port.
- `--model <gguf>` launch a llama-server for this model instead, from
  `--runtime <dir>` (default `runtimes/llama-cpp-luma`) on `--port` (8399) with
  `--ctx` (16384, also the router's window), `--gpu-layers` (99), `--jinja -fa on`
  and any `--server-arg` (repeatable); the server log lands beside the reports.
- `--effort <level>` the thinking dial's global default, as Setup's would be:
  `off`, `low`, `medium`, `high`, `xhigh` or `default` (the template's own;
  the default). The app's own default is what a user runs with, so pass it.
- `--turns <n>`, `--judge`, `--mock-side-calls` (the Lab's text-run options).
- `--scenario <name>` picks the playthrough: `harbour` (default), `body`,
  `reveal`, `wound`, `jungle` or `control` (see [LabTextScenarios](../../extensions/roleplay-mode/lab/LabTextScenarios.md)).
- `--no-grounding` turns the body and surface notes off. With grounding on
  and no host knowledge base, the run gets an in-memory `RagService` that the
  pack syncs into on the first turn.
- `--label <name>` suffixes the report folder; `--out <dir>` changes the root.
- `--repo <dir>` loads the roleplay mode, its post-processor and the Lab from
  another checkout (a git worktree of the commit to compare against); the
  router, the server launcher and the harness are always this repo's. That
  checkout needs the repo's modules on its path (`NODE_PATH` pointing at this
  repo's `node_modules` is enough).

## Methods

- `new TextRunCli(repoRoot, deps)`; `deps.dispatcher` replaces the real local
  dispatch path (tests); `execute(argv)` resolves the run result (plus
  `outDir`) or null for `--help`.
- `TextRunCli.parse(argv)`, `serverArgs(options)`, `modelRef(options)` (the
  `local::` ref the router routes on: the GGUF's stem, else `endpoint`),
  `endpoint(options)`, `summary(result)` (the scores, the cast pairs, the
  per-kind call counts with the narrator's average time, the report path).

## Example

```sh
npm run rp:text -- --model "%USERPROFILE%\.lmstudio\models\unsloth__Qwen3.8-27B-GGUF\Qwen3.8-27B-UD-Q6_K_M.gguf" --judge --effort low --label qwen27b
```

## Changes (2026-11-09, helper model)

`--side-model <gguf>` launches a helper llama-server (`--side-port` 8398, `--side-device` the second card when one exists, `--side-ctx` 8192; `sideServerArgs`, `serverEnv`) and gives the story `sideModel: 'helper'`; `--device <n>` pins the story server. The run taps the mode's rp-debug lines (`debugTap`, `debugSummary`: stage calls, parsed, failed, average time) and reads each launched server's log (`serverStats`: requests, prompt tokens evaluated, request time), both in the summary and in `text-run.json` (`debug`, `servers`).
