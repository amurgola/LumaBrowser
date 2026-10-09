# UnsupportedFlagMemory

`core/llm-server/server/UnsupportedFlagMemory.js`

Remembers, per runtime build, the launch flags that build rejected at spawn time,
so the launch planner never emits them again for that binary.

## Methods

- `UnsupportedFlagMemory.SETTINGS_KEY` is the LLM settings DB key
  (`llmServer.learnedUnsupportedFlags`); its value maps runtime key to flag list.
- `UnsupportedFlagMemory.runtimeKey(runtime)` returns `"<id>@<version>"`
  (`unknown` when the version is missing), or `null` without an id.
- `UnsupportedFlagMemory.learnedFlags(runtime, settingsDb)` returns the flags
  remembered for this exact build.
- `UnsupportedFlagMemory.withLearnedFlags(runtime, settingsDb)` returns the
  detector row with learned flags folded into `unsupportedFlags` (plus
  `learnedUnsupportedFlags`). Returns the same object when nothing was learned.
- `UnsupportedFlagMemory.remember(runtime, flag, settingsDb)` persists one
  rejected flag. Returns `true` only when it was newly recorded; the launcher uses
  that to decide whether a replan can change anything.

## Why it exists

llama.cpp removes flags. `--no-mmap` became an alias of `--load-mode none` in
b10105 and was deleted in b10875; a fresh install after that died on every launch
with `error: invalid argument: --no-mmap`. The planner's static build-number gates
cover removals we know about; this memory covers the ones we do not yet, and
runtimes whose version string cannot be read.

The key includes the version so a runtime update forgets what the old build
rejected: a newer build may accept the flag again. A missing or broken settings
DB degrades to no memory rather than throwing.

Consumers: the server launcher merges learned flags before planning and records a
flag when a launch dies on it, then replans once; the fit test merges the same set
so probe launches do not rediscover the rejection per combo.
