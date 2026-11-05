# LaunchBenchOptions

`tools/perf/llm/LaunchBenchOptions.js`

Command-line options of [LaunchBench](LaunchBench.md).

## Methods

- `LaunchBenchOptions.parse(argv)` returns `{ model, label, runtimeId, binaryPath, version, pin,
  contextSize, nPredict, longPredict, port, outDir, variants, help }`.
  - `--model <gguf or folder>` (required); `--label <name>` (alphanumeric, default `run`);
  - `--runtime <id>` (default `llama-cpp-cuda13`) or `--binary <llama-server> --version b<N>`;
  - `--pin <cuda indices>` (also sets `CUDA_VISIBLE_DEVICES`); `--ctx` (32768); `--n-predict` (384); `--warm` (16, warm-up tokens before measuring: thousands for a model whose experts exceed RAM); `--chat` (send every prompt as a user turn through the chat template: DeepSeek-V4.1 stops after one token on raw text);
    `--long <tokens>` (one extra long completion); `--port` (18099); `--out <dir>`;
  - `--variant <name>` starts a variant; `--set FLAG=VALUE`, `--drop FLAG`, `--env KEY=VALUE` edit it.
    With no variant the planned argv runs once as `planned`.
  - Throws on a missing model, a label or variant name outside `[a-zA-Z0-9_-]`, a duplicate
    variant, an edit before any `--variant`, `--binary` without `--version`, or an unknown option.
- `LaunchBenchOptions.applyVariant(args, variant)`: `--drop` first (a flag and, when the next
  token is not a flag, its value), then `--set` (replace the present value, else append).
- `USAGE`, `DEFAULT_RUNTIME`, `DEFAULT_CONTEXT`, `DEFAULT_PREDICT`, `LABEL_PATTERN`.

## Why

Variants are edits to the planner's argv rather than full command lines, so a run only states
what differs from the app's launch and the rest stays what the app would do. The label names
an output folder, so it is restricted the same way as the startup profiler's.
