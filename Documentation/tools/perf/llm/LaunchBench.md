# LaunchBench

`tools/perf/llm/LaunchBench.js`

Benchmarks llama-server launch configurations for one model the way the app would launch it:
the model is read by the real scanner, the cards by the live nvidia-smi snapshot plus RAM, and
[LaunchPlanner](../../../core/llm-server/server/LaunchPlanner.md) produces the argv. Each
variant edits that argv ([LaunchBenchOptions](LaunchBenchOptions.md)), runs through
[LaunchBenchServer](LaunchBenchServer.md) and is reported by [LaunchBenchReport](LaunchBenchReport.md).
Entry: `scripts/bench-llm-launch.js` (`npm run bench:llm-launch`).

## Methods

- `new LaunchBench(repoRoot, deps?)`: `deps` may inject `scanner`, `LaunchPlanner`,
  `CudaDeviceProbe`, `CudaPin`, `NvidiaSmiStream`, `runtimesDir`, `log` and `Sampler` for tests.
- `execute(argv)` resolves `{ outDir, results }` (or `null` after `--help`). Writes
  `planned.json` (argv + plan notes), `results.json`, `results.md`, one `<variant>.log` and one
  `<variant>.samples.csv` per run under `test-data/llm-launch-bench/<label>` (or `--out`).
- Each variant runs under a [LaunchBenchSampler](LaunchBenchSampler.md): one row a second with
  the phase (`load`, `warm`, `decode`, `long`, `prompt`), CPU busy, RAM, and per card SM and
  memory-controller load, frame buffer, power and PCIe traffic; `result.samples` carries the
  per-phase means and peaks the report prints.
- Measurements per variant: `loadSeconds` (spawn to `/health` ok), `vramMib` per card after a
  `--warm` token warm-up over the decode prompts (16 by default), three greedy 384-token completions (`decodeTps`, `decodeMeanTps`, `texts`),
  an optional `decodeLongTps` (`--long N`), a 110-paragraph prompt (`promptTokens`, `promptTps`,
  `decodeAtDepthTps`), `peakVramMib`, and `cacheStats` (llama.cpp's `llama_moe_cache` lines).
- `DECODE_PROMPTS`, `PROMPT_PARAGRAPH`, `PROMPT_PARAGRAPHS`: the fixed workload.

## Why

Launch tuning for big MoE models is a measurement job, and a one-off script per session gets
lost. This command keeps the workload fixed (same prompts, greedy, seeded, `cache_prompt` off)
so numbers from different days compare, and starts from the planner's own argv so what is
measured is what the app ships, plus a named edit. Runtime resolution reads the managed
runtime folder (`LUMA_RUNTIMES_DIR`, else `%LOCALAPPDATA%\LumaBrowser\runtimes` on Windows);
`--binary` with `--version` benchmarks a local build.

Measured 2026-11-02 on Qwen3.8-Flash-Next UD-Q4_K_XL (111 GB) with an RTX 5090 and an RTX 3090:
pinned host experts (`--load-mode none`) 59 tok/s against 31 memory-mapped; 4096-token prompt
micro-batches 1504 against 395 prompt tok/s; the 5090 alone beat both cards together (59 against
37 to 55 rising) because the 3090's PCIe 4 link and slower kernels serve its half of the layers
slower; the cache size scaled decode almost linearly (4 GB 37, 8 GB 46, 15 GB 59).
