# PerformanceProfiler

`tools/perf/PerformanceProfiler.js`

Repeatable real-Electron startup, idle and shell-interaction profile. Launches the app with Playwright's
`_electron` through `scripts/performance-entry.js` (see [PerformanceEntry](PerformanceEntry.md)) in an isolated
profile ([ProfileEnvironment](ProfileEnvironment.md)), then:

1. waits up to 30 s for the shell window (`/index.html`) and installs the long-task observer;
2. after 12 s takes the startup snapshot from `global.__lumaPerf`, stops the main CPU profile, resets the
   event-loop monitor, waits 6 s and takes the idle snapshot;
3. starts a `contentTracing` recording, installs the bounds hook and runs the page probes from
   [ShellPageScripts](ShellPageScripts.md): background updates in the hidden settings modal, five settings
   opens (`openSettings()` then `#settingsCloseBtn`), the bounds geometry (judged by
   [BoundsGeometryCheck](BoundsGeometryCheck.md); a failure throws), twelve tab switches and the paint and
   long-task timings (`--first-run` skips settings opens, geometry and tab switches);
4. stops the runtime trace, takes a screenshot, waits up to 30 s for the startup trace file, writes
   `report.json` and prints the headline JSON. `console.log` is written and the launched app closed even on failure.

Output folder: `test-data/performance/<label>/` with `report.json`, `chromium-trace.json` (startup trace),
`runtime-trace.json`, `main.cpuprofile`, `shell.png`, `console.log` and the `profile/` data folder.
Thin entry: `scripts/profile-performance.js` (`npm run profile:performance -- <label> [--first-run] [--no-adblock]`).

## Methods

- `new PerformanceProfiler(root, { electron, electronPath, log, sleep })`; `execute(argv)` resolves the report.
- Report keys: `shellReadyMs`, `startup`, `idle`, `interactions`, `renderer`, `rendering`, `geometry`,
  `tabSwitches`, and new `boundsHooked` (whether the bounds probe reached the shell's reporter).
