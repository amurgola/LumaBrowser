# ModelFeatureNotes

`core/llm-server/server/launch/ModelFeatureNotes.js`

The plan notes that explain how a launch runs the model.

## Methods

- `ModelFeatureNotes.build(state)` returns, in order and only when they apply:
  KV cache precision; flash attention (forced or not); the SWA cache (full, or
  windowed with the VRAM it saves); MTP (ik grammar, mainline pipeline with the
  grafted-head or detached-head line, or why it is off: flags, ik with a detached
  head, no `-md`); standalone n-gram speculation; the draft KV cache; context
  shift off; skipped flags; a suppressed projector; the runtime's extra args; the
  user's flags.

## Why

Each note names the flag it explains, so a user reading the launch log can find
it in argv. Notes about features that are off say why, so nothing is a silent
no-op.
