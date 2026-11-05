# LaunchBenchSampler

`tools/perf/llm/LaunchBenchSampler.js`

One-second samples of the host and every GPU while a [LaunchBench](LaunchBench.md) variant
runs, tagged with the phase the bench is in, written as CSV beside the variant's log and
reduced to per-phase means and peaks for [LaunchBenchReport](LaunchBenchReport.md).

## Methods

- `new LaunchBenchSampler({ file, spawnFn?, now?, cpuTimes?, memory?, intervalMs? })`: the CSV
  path plus test seams for `nvidia-smi`, the clock, `os.cpus` times and `{ total, free }` memory.
- `start(phase)` spawns `nvidia-smi dmon -s pumt -d 1` (power and temperature, utilization,
  frame buffer, PCIe throughput; one line per card per second) and starts the interval.
  Without `nvidia-smi` the GPU columns stay empty and the host columns still fill.
- `mark(phase)` tags the rows from now on (`load`, `warm`, `decode`, `long`, `prompt`).
- `sample()` one row: ISO time, `elapsed_s`, `phase`, `cpu_pct` (non-idle share of the summed
  core time delta since the last row), `ram_used_mb`, `ram_free_mb`, and per card the latest
  dmon line as `sm_pct`, `mem_pct`, `fb_mb`, `power_w`, `rx_mbs`, `tx_mbs`. The file is rewritten
  every `FLUSH_EVERY` (30) rows, so a run killed from outside keeps most of its samples.
- `stop()` takes a last row, ends dmon, writes the CSV and resolves `summary()`.
- `summary()` `{ file, gpus, phases: { <phase>: { seconds, cpuPct, ramUsedMb, gpus: [{ index,
  smPct, fbMb, powerW, pcieMbs }] } } }`, each metric `{ mean, peak }` (null when never sampled);
  `pcieMbs` is receive plus transmit.
- Statics: `parseDmonHeader(line)` (the `# gpu pwr ...` line names the columns, null for the
  units line), `parseDmonRow(line, columns)` (`-` reads as null), `cpuBusyPct(before, after)`,
  `csv(rows, gpus)` (`gpu<i>_<field>` columns, blanks for missing values), `reduce(rows, gpus)`.

## Why

The bench used to read VRAM three times per run and nothing else, so a load that died or a
decode that crawled left no trace of where the time went: whether the cards sat idle on the
PCIe link, the CPU was pinned on page faults, or RAM filled. A per-second CSV with the phase
in each row answers that after the fact, and the report's per-phase table gives the glance.
`dmon` is one long-lived process rather than a query per second, so the sampler itself costs
the run nothing measurable.
