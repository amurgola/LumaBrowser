# PromptBenchArgs

`tools/prompt-bench/PromptBenchArgs.js`

Parses the `bench:prompt` command line into run options and holds the `--help` text.

## Methods

- `PromptBenchArgs.parse(argv)` takes the arguments after the script path and returns
  `{ label, model, ctx, only, native, repeat, compare?, out?, list?, help? }`. Defaults: `label` "run", `model`
  `Qwen3.8-27B-UD-Q6_K_M`, `ctx` 32768, `only` `[]`, `native` false, `repeat` 1. `--only` repeats. Throws
  `unknown argument: X`, `<flag> needs a value` (a missing value, or the next flag in its place), for `--ctx`
  below 1024 or not a number `--ctx must be a token count of 1024 or more`, and for `--repeat` outside 1 to 10
  `--repeat must be 1 to 10`.
- `PromptBenchArgs.USAGE`: the help text. Constants `DEFAULT_MODEL`, `DEFAULT_CONTEXT`, `DEFAULT_LABEL`,
  `MAX_REPEAT`.
