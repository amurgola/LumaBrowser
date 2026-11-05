# LaunchBenchReport

`tools/perf/llm/LaunchBenchReport.js`

Renders [LaunchBench](LaunchBench.md) results.

## Methods

- `LaunchBenchReport.line(result)`: one console line (`<variant>: load 45.8s, vram gpu0 23376, decode
  58.43/59.65/58.82 long 60.97, prompt 395.9 tok/s, depth 43.93, cache 90.00%`), or `<variant>: <error>`.
- `LaunchBenchReport.markdown(results, planned)`: the planned argv, a table with `COLUMNS`
  (variant, load s, VRAM MiB, peak MiB, decode tok/s, long tok/s, prompt tok/s, depth tok/s,
  cache, error) and each variant's argv below it.
- `LaunchBenchReport.hitRate(lines)`: the latest `ubatch <= 8` hit rate in llama.cpp's cache log
  lines, `''` when absent.
- `LaunchBenchReport.samples(result)`: the lines of a `## <variant> samples` table from
  `result.samples` ([LaunchBenchSampler](LaunchBenchSampler.md) summary): one row per phase with
  seconds, CPU %, RAM GB and per card SM %, FB GB, W and PCIe MB/s as `mean / peak`; `[]`
  without samples. `markdown` appends it for every variant.

## Why

The table is meant to be pasted into a note as it is, so pipes inside cells are replaced and
empty cells stay empty rather than printing `undefined`.
