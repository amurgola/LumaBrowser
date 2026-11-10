# LabHelperModel

`tools/roleplay/LabHelperModel.js`

The helper model as the Lab's router sees it outside the app: a second
llama-server the CLI launched (`--side-model`) presented with the
`HelperModelService` surface the router reads (`readyRef`, `facade`,
`contextSize`, `getStatus`), so `helper::<stem>` routes through the same
[HelperStream](../../core/llm-server/chat/router/HelperStream.md) the app uses
and a story's `sideModel: 'helper'` takes it.

## Methods

- `new LabHelperModel({ stem, host, port, ctx, runtimeId, ready })`; `ready()`
  says whether the launched server is alive (the Lab passes the process's
  liveness).
- `ref()`, `readyRef()`, `contextSize()`, `getStatus()`, `facade()`.
