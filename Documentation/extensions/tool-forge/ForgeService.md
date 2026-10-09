# ForgeService

`extensions/tool-forge/ForgeService.js`

The create -> test -> publish state machine behind the builder tools, and the
safety gates between the steps.

## Methods

- `new ForgeService({ store, configStore, host, validator, getExistingNames, enableTool, logger })`.
- `createTool(input)`: gates in [ToolDraftInput](ToolDraftInput.md); saves a
  draft with `lastTest: null`. Returns `{ success, name, version, status,
  configSlots: [{ key, required, secret }], allowedHosts, otherTools?, next }`.
- `testTool({ name, args, configOverrides })`: unknown name ->
  [ToolNames](ToolNames.md)`#notFound`. Runs `host.run`; a pass stamps
  `lastTest { ok, codeHash, at, sampleArgs, resultPreview (500 chars) }` and
  remembers the overrides ([PendingTestConfig](PendingTestConfig.md)). Returns
  `{ success, result, error, truncated, missingConfig, next }`.
- `publishTool({ name }, { conversationId })`: already published -> re-runs the
  enable only (`alreadyPublished: true`). Refuses unless `lastTest.codeHash`
  equals the current code's hash (`The code changed since the last passing
  test...` / `This tool has not passed a test yet...`). Then marks published,
  saves pending config for the same hash (`configSaved`), `host.refresh()`
  (`registered`) BEFORE enabling (`enabled`, never throws), and reports
  `missingConfig`. Always `toolCatalogChanged: true` so the chat bridge admits
  the tool into the current run.
- `exportBundle(name)`, `importBundle(bundle)` -> [ToolBundleCodec](ToolBundleCodec.md).

## Why

Publishing used to leave the tool default-off, which played out live as
"publish, go to the gear panel, not allowed for this run". It now enables the
tool where the user asked for it. Config pasted in chat during the build is
carried to the saved config so nobody pastes it twice.
