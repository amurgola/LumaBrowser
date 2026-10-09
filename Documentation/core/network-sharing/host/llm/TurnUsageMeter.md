# TurnUsageMeter

`core/network-sharing/host/llm/TurnUsageMeter.js`

Counts one shared LLM turn's consumption and banks it against the paired
client exactly once.

## Methods

- `new TurnUsageMeter(service, credential)` (`service.recordUsage`, `credential` = `req.sharingToken`).
- `setUsage(usage)` (null ignored; the latest report wins), `usage()`.
- `countArtifact(artifact)`: counts `image` and `video` artifacts.
- `bank()`: once, `service.recordUsage(credential, { tokens, images, videos })`.
- `TurnUsageMeter.totalTokens(usage)`: `total_tokens`, else prompt + completion, 0 for none.

## Why

A turn can end in done, error, cancel or disconnect, sometimes more than one
of them; banking once keeps the counters honest. For agent turns the latest
usage is the cumulative context fill, not a per-iteration sum. Artifacts are
already persisted when announced, so they count even if the turn fails.
