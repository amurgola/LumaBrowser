# HfReadme

`core/llm-server/models/HfReadme.js`

Fetches a HuggingFace repo's model card for the model preview pane.

## Methods

- `HfReadme.fetch(repoId, { signal })` returns the README markdown with any
  leading YAML frontmatter (`--- ... ---`, optionally after a BOM) stripped,
  capped at `HfReadme.MAX_CHARS` (256 KiB) with `HfReadme.TRUNCATION_NOTE`
  appended when cut. Returns `null` when the card is missing, gated or the
  request fails. Throws `HF_BAD_ID` for a malformed id.

## Why

A missing card must never break the preview; it is simply omitted. The cap
keeps a pathological card from ballooning the IPC payload.
