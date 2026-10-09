# WhisperLaunchPlanner

`core/whisper-server/server/WhisperLaunchPlanner.js`

Plans the whisper-server (whisper.cpp v1.9.x) argv for a model file and port.
Extends `MediaLaunchPlanner`.

## Methods

- `new WhisperLaunchPlanner().plan({ binaryPath, modelPath, port, threads?, language?, cpuCount? })`
  returns `{ binaryPath, args, plan }` where
  `args = ['-m', modelPath, '--host', '127.0.0.1', '--port', port, '-t', threads, '-l', language]`
  and `plan = { port, modelPath, modelName, threads, language, englishOnly }`.
  Throws `WhisperLaunchPlanner: <name> is required` for a missing
  `binaryPath`, `modelPath` or `port`.
- `WhisperLaunchPlanner.isEnglishOnlyModel(modelPath)` is true for `*.en.bin`
  and `*.en-*` / `*.en.*` names.
- Statics: `HOST`, `MIN_THREADS` (2), `MAX_THREADS` (8).

## Rules

- Threads: an explicit positive `threads` wins; otherwise half the cores
  (`cpuCount`, injected for tests, else `os.cpus().length`), clamped to [2, 8],
  leaving the rest to the LLM.
- Language: lower-cased, default `auto`. English-only models are forced to `en`
  because they hard-reject auto-detection and exit at startup.
- GPU use is implicit in the CUDA build, so there is no GPU flag; the CPU build
  simply has no GPU backend.
