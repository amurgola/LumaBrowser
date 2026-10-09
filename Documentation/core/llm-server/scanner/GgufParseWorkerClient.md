# GgufParseWorkerClient

`core/llm-server/scanner/GgufParseWorkerClient.js`

Runs GGUF header parses on one lazily spawned worker thread (the
[GgufHeaderParseWorker](../GgufHeaderParseWorker.md) entry) for
[LlmModelsScanner](../LlmModelsScanner.md).

## Methods

- `new GgufParseWorkerClient({ spawn, parse = GgufParser.parseHeader, idleMs = 30 s })`;
  `spawn()` returns a Worker (production: `LlmModelsScanner.spawnParseWorker`).
- `parse(filePath)` resolves the parse result; posts `{ id, filePath }` and
  resolves the matching `{ id, res }` reply. Never rejects.
- `stop()` terminates the worker and clears the idle timer.
- `IDLE_MS`.

## Rules

- One shared worker, spawned on first use and `unref`ed so it never holds the
  process open; torn down after the idle window once nothing is pending.
- A spawn that throws marks the client broken: every later parse runs in-process,
  no retries this process.
- A worker `error` marks it broken and sends in-flight requests to the in-process
  parse; an unexpected `exit` does the same but the next parse spawns a new worker.
- A `postMessage` that throws parses that one file in-process.

## Why

A cache-miss parse walks ~10 MB of header (tokenizer and tensor infos), and a
rescan can fire while the app is busiest (boot, a fit test streaming a 26 GB
GGUF). Every failure falls back so a packaged build whose worker entry cannot
load still scans, only slower.

## Bug fixed

Legacy handled a worker's `exit` by nulling whichever worker was current and
failing all pending requests to the fallback. After an idle teardown the old
worker's late `exit` could arrive once a replacement was running, orphaning it
(never terminated) and diverting its requests. Events now only act when they
come from the live worker (test: "a late exit from a replaced worker ...").
