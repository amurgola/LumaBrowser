# PeerGpusHint

`core/llm-server/ui/js/setup-ui/defaults/PeerGpusHint.js`

The "Peer GPUs" row's caption: every GPU the attached peers offer, or a pointer to attach one.

## Methods

- `fill(api, doc)` (best-effort), `text(result)`.

## Globals

Reads `#peerGpusHint`.

## Changes (2026-11-22, framework refactor)

The Peer GPUs row moved to the Frameworks card; [RuntimesCard](../runtimes/RuntimesCard.md) fills it after each paint, only when `#peerGpusHint` is present (the frame of the framework that serves the default model).
