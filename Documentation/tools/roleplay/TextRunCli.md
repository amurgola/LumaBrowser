# TextRunCli

`tools/roleplay/TextRunCli.js`

Runs the Roleplay Lab's scripted text playthrough against a real model from the terminal: `npm run rp:text -- [options]` (`scripts/rp-text-run.js`).

## Options

- `--base-url <url>` an OpenAI-compatible base that is already up (default
  `http://127.0.0.1:8317/v1`, the app's Local API).
- `--model <gguf>` launch a llama-server for this model instead, from
  `--runtime <dir>` (default `runtimes/llama-cpp-luma`) on `--port` (8399) with
  `--ctx` (16384), `--gpu-layers` (99), `--jinja -fa on` and any `--server-arg`
  (repeatable); the server log lands beside the reports.
- `--turns <n>`, `--judge`, `--mock-side-calls` (the Lab's text-run options).
- `--think` leaves the model's reasoning on (off by default).
- `--label <name>` suffixes the report folder; `--out <dir>` changes the root.
- `--repo <dir>` loads the roleplay mode, its post-processor and the Lab from
  another checkout (a git worktree of the commit to compare against), so a
  before/after of a prompt change is two invocations against the same model.
  That checkout needs the repo's modules on its path (`NODE_PATH` pointing at
  this repo's `node_modules` is enough).

## Methods

- `new TextRunCli(repoRoot, deps)`; `execute(argv)` resolves the run result
  (plus `outDir`) or null for `--help`.
- `TextRunCli.parse(argv)`, `serverArgs(options)`, `summary(result, chat)`
  (the scores, the cast pairs, per-kind call timings, the report path).

## Example

```sh
npm run rp:text -- --model "%USERPROFILE%\.lmstudio\models\unsloth__Qwen3.8-27B-GGUF\Qwen3.8-27B-UD-Q6_K_M.gguf" --judge --label qwen27b
```
