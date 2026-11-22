# DefaultRuntimeFollower

`core/llm-server/service/DefaultRuntimeFollower.js`

Keeps the stored default runtime id equal to the runtime that serves the default model.

## Methods

- `new DefaultRuntimeFollower({ service, scanner })`.
- `resolve()`: `{ modelPath, runtimeId, frameworkId, why }` for the default model, changing nothing. `runtimeId`
  is null when no installed runtime loads it. Null when no default model is set or it is not in the scan.
- `follow()`: `resolve()`, then stores the runtime id through `service.setDefaults` when it differs. Adds
  `changed`. Nothing is written when nothing installed loads the model.

## Why

About a dozen readers and 45 test files treat `defaults.runtimeId` as the runtime in use (the request adapter,
the RAM pin plan, the provider card, status lines). Keeping the field and making it a record of the resolver's
answer changes what it means without changing who reads it.
