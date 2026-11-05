# LaunchBenchServer

`tools/perf/llm/LaunchBenchServer.js`

One llama-server run under [LaunchBench](LaunchBench.md).

## Methods

- `new LaunchBenchServer({ binaryPath, args, env, port, logPath })`.
- `start()`: spawns with stdout and stderr in `logPath`, polls `/health` every 1.5 s for up to
  30 min; resolves the seconds to ready, or `null` when the process died or the limit passed.
- `complete(prompt, nPredict, { chat })`: `/completion` (or, with `chat`, `/v1/chat/completions` with the
  prompt as one user turn, the reply normalised to `{ content, timings }` with any reasoning text prepended) with `temperature 0`, `top_k 1`, `seed 1`,
  `cache_prompt false`; returns the server's JSON including `timings`.
- `request(route, body, timeoutMs)`; `stop()` (kill, wait up to 20 s, then a 4 s settle);
  `cacheStatsLines()` (the last `llama_moe_cache` lines of the log); `alive`.
- `LaunchBenchServer.gpuMemoryMib()`: `{ gpu0: usedMiB, ... }` from nvidia-smi, empty without it.
- `HEALTH_POLL_MS`, `READY_LIMIT_MS`, `REQUEST_TIMEOUT_MS`, `STOP_WAIT_MS`, `SETTLE_MS`.

## Why

A hard kill is the only portable stop; llama-server logs its cache statistics in a destructor,
so builds that print them periodically are what the stats column relies on. The settle pause
lets the driver release VRAM before the next variant's baseline reading.
