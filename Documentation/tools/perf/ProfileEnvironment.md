# ProfileEnvironment

`tools/perf/ProfileEnvironment.js`

The isolated environment and Electron arguments for one profiling run, so a profile never touches the owner's
installed LumaBrowser.

## Methods

- `ProfileEnvironment.env(output, options, port, baseEnv)`: `baseEnv` plus `LUMA_DATA_DIR=<output>/profile`,
  `LUMA_CLI_HANDSHAKE=<output>/cli-handshake.json`, `LUMA_PERF_OUTPUT`, `LUMA_API_PORT`, `NO_TELEMETRY=1`,
  `LUMA_PERF_FIRST_RUN` and `LUMA_PERF_NO_ADBLOCK` (`'1'` or `'0'`); `ELECTRON_RUN_AS_NODE` removed.
- `ProfileEnvironment.args(entryScript, output)`: the entry script, then `--trace-startup=<categories>`,
  `--trace-startup-duration=10`, `--trace-startup-format=json`, `--trace-startup-file=<output>/chromium-trace.json`.
- Constants: `TRACE_CATEGORIES` (also used for the runtime `contentTracing` recording), `STARTUP_TRACE_SECONDS`,
  `PROFILE_DIR`, `HANDSHAKE_FILE`, `STARTUP_TRACE_FILE`.
