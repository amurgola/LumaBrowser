# PromptBenchCli

`tools/prompt-bench/PromptBenchCli.js`

The `bench:prompt` command (thin entry `scripts/bench-prompt.js`): a short regression bench for the chat system
prompt. Each case is a real chat turn in the real app on one local model, so what is measured is the prompt the
model really receives, with the user's extensions and tool groups in it.

    npm run bench:prompt -- --label after-change --compare tmp/prompt-bench/<earlier run>

A full run takes about two minutes on Qwen3.8-27B Q6 with a 32k window (20 cases, 80 to 100 seconds of turns plus
boot and model load); `--repeat 3` about five.

## Methods

- `new PromptBenchCli({ root?, session?, fixture?, now?, stdout?, stderr? })`. `session` is
  `(options) => { open, runCase, close }` (default a [PromptBenchSession](PromptBenchSession.md)); `fixture` is
  `{ start, stop }` (default a [PromptBenchFixture](PromptBenchFixture.md)).
- `execute(argv)` resolves the exit code:
  1. parse ([PromptBenchArgs](PromptBenchArgs.md)); a bad argument writes the error and returns 2;
  2. `--help` prints the usage and `--list` the cases; both 0;
  3. load the `--compare` run (its folder or its `results.json`), start the fixture, build the cases
     ([PromptBenchCases](PromptBenchCases.md)) and keep the `--only` ones (an unknown id is an error);
  4. open the session; the run stops with exit 2 when the warm-up turn failed or the live launch plan names another
     model than the one asked for;
  5. run each case `--repeat` times, score each trial with [Scorer](../../core/llm-server/eval/Scorer.md) and
     print one progress line per trial to stderr (`pass|FAIL  <id>  <seconds>  context <tokens>`). A case passes
     when every trial passes; its `score` and `ms` are the trials' means, its context the fullest any trial reached,
     and its `turns` and `checks` those of the first failing trial (the first trial when none failed);
  6. write the run folder, close the session and the fixture (also when the run failed), print the report
     ([PromptBenchReport](PromptBenchReport.md)) to stdout;
  7. return 1 when a case passed in the compared run and fails now, else 0.

## The run folder

`tmp/prompt-bench/<start time>-<label>/` (git-ignored), or `--out`:

| File | Content |
|---|---|
| `results.json` | the run: `label`, `startedAt`, `options`, `server`, `loadMs` and per case `id`, `tools`, `passed`, `passes`, `trials`, `score`, `checks`, `ms`, `metrics` and `turns` (each turn's prompt, full response, reasoning, tool calls, error, time) |
| `report.md` | the report as printed |
| `system-prompt-tools.txt`, `system-prompt-plain.txt` | the system prompt of the first Tools-on and the first Tools-off case, exactly as sent, for diffing two runs |

## Which tool-call route a run uses

A run pins the route: without `--native` it forces the text fence, also for a family whose own default is native
(Gemma 4, DeepSeek V4); with `--native` it registers tools natively, which needs a family that can take them. So a
native-default family is benched as shipped with `--native`, and without it to see what the fence would do.

## Reading a result

One trial is one sample at the model's normal sampling, so a single changed case can be noise, and a single pass
can be luck: on 2026-11-18 a wording change that made the model skip an asked-for web search in 3 of 5 runs passed
its first full run. Use `--repeat 3` (or `--only <case> --repeat 5`) before concluding either way. The `scripts/bench-prompt.js` entry keeps the run going when Playwright reports "Target crashed"
(a tab's renderer went down; the app recovers the tab and the turn still ends). Until 2026-11-18 every run printed
it once, for the crash described in [TabLoader](../../core/browser/tab-view/TabLoader.md); a run that prints it now
has found a new one.
