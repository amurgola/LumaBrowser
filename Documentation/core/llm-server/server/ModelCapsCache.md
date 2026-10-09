# ModelCapsCache

`core/llm-server/server/ModelCapsCache.js`

Remembers what a model can do (reasoning-effort support and probed thinking
facts) per model file, stored in the settings DB under one key.

## Methods

- `new ModelCapsCache({ settingsDb, statSync = fs.statSync })`. `settingsDb`
  needs `get(key, default)` and `set(key, value)`.
- `remember(modelPath, caps)` records `{ reasoningEffort: boolean, thinking? }`.
  Returns `true` only when something was written.
- `recall(modelPath)` returns `{ reasoningEffort, thinking? }` for that file, or
  `null` when unknown, the file changed, or the file is gone.
- `recallProbe(modelPath, templateHash)` returns the cached probe facts only if
  they were probed from the template now being served (same hash), else `null`.
- `ModelCapsCache.modelKeyOf(modelPath)` is the normalised key (lower-cased on
  Windows); callers use it to compare "is this the running model".
- `ModelCapsCache.CAPS_KEY`, `ModelCapsCache.MAX_ENTRIES` (200).

## Why

The only honest source for a capability is the running server, but the chat
starts its model on the first message, so a control that waits for the live
probe is missing exactly when the user wants to set it: before sending. A
discovered answer is kept here and served for that model until a later load
says otherwise.

Entries are stamped with the file's size and mtime because the capability lives
in the GGUF's embedded chat template: a re-download or repack at the same path
must not inherit the old answer. Probed thinking facts also carry the
template's hash, so a load can skip re-probing an unchanged template.

Only definite answers are stored. A failed probe is "unknown" and never
overwrites what an earlier load learned, and a probed answer is never replaced
by a regex-era one for the same template (it can be replaced by a regex answer
that names a different template hash). The map is bounded, oldest evicted,
because models get deleted and renamed and nothing else prunes it.

Paths are normalised because the picker, the defaults row and the launch plan
each carry the path, and a spelling difference between them used to hide the
thinking dial.
