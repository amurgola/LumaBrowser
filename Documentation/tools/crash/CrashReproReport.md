# CrashReproReport

`tools/crash/CrashReproReport.js`

The console text of a crash-repro session: the plan header, one verdict line per launch
(`CRASH pid=7 exit=-1073741819 (0xC0000005) after 9.5s`), the reproduction details (last event, trace log and
whether it has an END line, minidumps, artifacts folder) and the closing summary.

## Methods

- `CrashReproReport.hex(code)`: ` (0xC0000005)` for NTSTATUS-style codes, `''` for 0..255 and non-numbers.
- `header(options, { userData, traceDir })`, `runLine(result)`, `reproductionLines(result)`, `summaryLines(results)`: arrays of lines (runLine a string).
