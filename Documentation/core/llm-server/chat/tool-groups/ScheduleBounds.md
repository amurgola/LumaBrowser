# ScheduleBounds

`core/llm-server/chat/tool-groups/ScheduleBounds.js`

The `schedule_artifact_updates` interval bound in minutes, derived from the
clamp [ArtifactTaskStore](../ArtifactTaskStore.md) enforces, so the prose
manual and the JSON schema can never quote a limit the store does not apply.

## Members

- `ScheduleBounds.MIN_EVERY_MINUTES` (5), `ScheduleBounds.MAX_EVERY_MINUTES` (1440).
- `ScheduleBounds.rangeText()`: `"5 to 1440"`, the phrase both surfaces quote.
