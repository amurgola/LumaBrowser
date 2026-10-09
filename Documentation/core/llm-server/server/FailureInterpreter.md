# FailureInterpreter

`core/llm-server/server/FailureInterpreter.js`

Turns a dead inference child's error text into an actionable diagnosis, and
names the launch flag an argparser rejected.

## Methods

- `FailureInterpreter.interpret(text)` returns `{ kind, title, advice }` for the
  first matching rule, or `null` when nothing matches (callers then show the raw
  text). Kinds: `oom`, `unknown-flag`, `bad-model`, `driver`.
- `FailureInterpreter.extractUnknownFlag(text)` returns the flag named by an
  unknown-flag failure (`--no-mmap`, `-lm`), or `null`.
- `FailureInterpreter.RULES` is the ordered rule table.

## Why

Two consumers: the launcher's OOM rescue keys its one-shot conservative replan
off `kind === 'oom'` and its unsupported-flag memory off `extractUnknownFlag`;
the runtime server ships the interpretation to the LLM tab as `lastErrorInfo` so
the status card leads with what to do instead of a stderr dump.

Rule order matters. llama.cpp OOMs often read "error loading model: unable to
allocate CUDA0 buffer", which also matches the bad-model patterns, so memory
rules are tried first.

`extractUnknownFlag` covers the wordings seen across llama.cpp generations
(`invalid argument: --x` on current mainline, `unknown argument: --x` on older
builds and forks, `unrecognized arguments: --x` on argparse-style servers). A
bad value for a known flag (`error while handling argument "--x"`) is
deliberately not matched, because dropping that flag would hide a real mistake.
