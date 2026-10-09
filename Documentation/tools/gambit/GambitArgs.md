# GambitArgs

`tools/gambit/GambitArgs.js`

Parses the `run-gambit` command line into run options and holds the `--help` text.

## Methods

- `GambitArgs.parse(argv)` takes the arguments after the script path and returns
  `{ groups, tasks, timeout, out?, model?, ctx?, nativeHistory?, promptExperiments?, parallel?, agentEffort?,
  nativeTools?, json?, list?, keepOpen?, help? }` (`timeout` defaults to 90 minutes). Throws
  `unknown argument: X`, and on bad `--prompt` (`no-exec-rules`), `--parallel` (1..8),
  `--agent-effort` (`default|low|medium|high|xhigh`) or `--native-tools` (only `off`) values.
- `GambitArgs.USAGE`: the help text. Constants `DEFAULT_TIMEOUT_MS`, `PROMPT_EXPERIMENTS`, `AGENT_EFFORTS`.
