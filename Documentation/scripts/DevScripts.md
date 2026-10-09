# Dev scripts

Thin entries under `scripts/` for development, diagnostics and the website. Each one only wires a `tools/` class.
Build entries are in [BuildScripts](BuildScripts.md).

| Script | Calls | Notes |
|---|---|---|
| `scripts/docs-for.js` | [DocsForCli](../tools/docs/DocsForCli.md) | `<path...> \| --changed \| --all [--explain] [--json]`; exit 1 on malformed front matter |
| `scripts/cleanup.js` | [ProcessCleanup](../tools/dev/ProcessCleanup.md) | `npm run cleanup [-- --dry-run]`; kills electron.exe and listeners on 3000/3001 |
| `scripts/profile-performance.js` | [PerformanceProfiler](../tools/perf/PerformanceProfiler.md) | `npm run profile:performance -- <label> [--first-run] [--no-adblock]`; Playwright `_electron`; output test-data/performance/<label>; isolated data dir, handshake and port |
| `scripts/performance-entry.js` | [PerformanceEntry](../tools/perf/PerformanceEntry.md) | Electron entry launched only by profile-performance; refuses to run without LUMA_PERF_OUTPUT and LUMA_DATA_DIR |
| `scripts/summarize-performance.js` | [PerformanceSummary](../tools/perf/PerformanceSummary.md) | `[dir]` (default test-data/performance/run); writes summary.json |
| `scripts/summarize-runtime-trace.js` | [RuntimeTraceSummaryCommand](../tools/perf/RuntimeTraceSummaryCommand.md) | `npm run profile:summarize-runtime -- <capture-dir>`; exit 1 with usage when no folder is given |
| `scripts/crash-repro.js` | [CrashRepro](../tools/crash/CrashRepro.md) | `npm run crash:repro`; `--help`, `--dry-run`; exit 0 clean, 1 reproduced, 2 refused; set `LUMA_DATA_DIR` for an isolated profile |
| `scripts/crash-repro-interact.ps1` | Win32 input (user32) | `-ProcId <pid> -Seconds N`; started by InteractionDriver for `--interact`; see [CrashScripts](../tools/crash/CrashScripts.md) |
| `scripts/decode-minidump.py` | `pip install minidump` | `python scripts/decode-minidump.py <file.dmp> [--slots 60]` |
| `scripts/symbolize-breakpad.py` | stdlib only | `python scripts/symbolize-breakpad.py <file.sym> 0x<offset> ...` |
| `scripts/build-site-dev-replays.js` | [SiteReplayBuilder](../tools/site-replays/SiteReplayBuilder.md) | `npm run build:site-replays [-- --out <dir>] [--site <LumaByte repo>/www/demo]`; default out `tmp/site-dev-replays/dev` |
| `scripts/cli-tui-demo.js` | [CliTuiDemo](../tools/site-replays/CliTuiDemo.md) | `--auto` plays one turn and quits; `--reasoning` |
| `scripts/jetbrains-webview-demo.js` | [JetBrainsWebviewDemo](../tools/site-replays/JetBrainsWebviewDemo.md) | `[--light] [--out dir]`; Playwright + Edge; exit 1 on failed checks |
| `scripts/vscode-webview-demo.js` | [VscodeWebviewDemo](../tools/site-replays/VscodeWebviewDemo.md) | `[--light] [--out dir]`; Playwright + Edge; exit 1 on failed checks |
| `scripts/run-gambit.js` | [GambitCli](../tools/gambit/GambitCli.md) | `--help`, `--list` without booting; otherwise boots the app via the e2e AppLauncher on a seeded temp dir. Exit 0 ok, 1 below usable, 2 error |
| `scripts/gambit-compare.js` | [GambitComparison](../tools/gambit/GambitComparison.md) | `<baseline.json> <candidate.json>` (run-gambit `--out` files) |
| `scripts/verify-model-catalogs.js` | [CatalogUrlVerifier](../tools/catalogs/CatalogUrlVerifier.md) | HEADs every curated catalog URL; `--list` dry run; exit 1 on any failure |
