# ArtifactManuals

`core/llm-server/chat/tool-groups/ArtifactManuals.js`

Data only: the full prose manuals for the artifact tool groups, shown to the
model once the group is active.

## Members

- `ArtifactManuals.ARTIFACT`: `create_artifact` (how to pick `type`) and
  `edit_artifact` (targeted replacements vs full rewrite, live-module edits).
- `ArtifactManuals.LIVE_ARTIFACT`: `create_live_artifact`: the run contract
  (`root`, `R`, `Chart`, `store`, `luma`), house style, charts, persistent and
  live web data, extension APIs through `luma.ext(extensionId)` (the Hub's
  task board, agenda and conversation queue as the worked example), and how to
  edit a live module.
- `ArtifactManuals.ARTIFACT_DATA`: `get_artifact_data`,
  `update_artifact_data`, `schedule_artifact_updates` (bound from
  [ScheduleBounds](ScheduleBounds.md)).

## Why

The manuals are long on purpose: a weak local quant reads nothing else. Each
parameter here must also exist in [PseudoToolSchemaTable](../tool-schemas/PseudoToolSchemaTable.md).
