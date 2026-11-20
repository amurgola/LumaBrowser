# PreflightSelectionIssues

`core/llm-server/PreflightSelectionIssues.js`

[Preflight](Preflight.md) issues for a saved model choice that can no longer be
used: the helper model's file, the image, image editor and video default
models, and an extension slot bound to a model no provider offers any more.
Each is marked `selection: true`, which is what the shell alerts on at startup
([StartupModelAlert](../../ui/shell/notifications/StartupModelAlert.md)), and its
fix opens the page the choice is made on. The fix also carries `settingId`, the
search palette's catalog entry for the control itself (`core/palette/catalog`),
which is how the alert takes the user to the exact spot
([PaletteOpener](../palette/PaletteOpener.md)`.reveal`).

## Methods

- `PreflightSelectionIssues.collect({ llm, image, llmService, fileExists })` (async)
  resolves the issues in this order:
  - `llm-helper-model-missing` (area `llm`): the helper model is enabled and its
    `modelPath` no longer exists; fix
    `{ kind: 'open-view', view: 'settings', settingId: 'llm.helper-model-file' }`.
  - `image-model-missing`, `image-edit-model-missing`, `image-video-model-missing`
    (area `image`): a default (`modelId`, `editModelId`, `videoModelId`) names a
    model `image.listInstalledModels()` does not list with that kind (`generate`,
    `edit`, `video`); fix `{ kind: 'open-view', view: 'image', settingId }` with
    `image.model`, `image.edit-model` or `image.video-model`. `image` is null
    while image generation is off.
  - `slot-model-unavailable:<slotId>` (area `slots`): one per entry of
    `llmService.unavailableSlots()` ([LLMService](../llm-service/LLMService.md));
    fix `{ kind: 'open-settings', tab: 'extensions', extensionId, settingId: 'ext.<extensionId>', selector }`
    (`selector`: the slot's declared `picker`, else null), or for a slot
    of the app itself (`extensionId` is `CORE_OWNER`, `'core'`, or missing)
    `{ kind: 'open-settings', tab: 'aiproviders', extensionId: null, settingId: 'aiproviders.providers' }`.
  - `agent-model-unavailable:<agentId>` (area `agents`): one per entry of
    `agentManager.agentsWithMissingModel()` (the Agent Manager's public surface, see
    `extensions/agent-manager/AgentModels`). `llm.freshInstalledChatModels()` is awaited first,
    since the agents answer from the chat's model list and a list not read yet would report an
    agent on an installed model. Fix `{ kind: 'open-view', view: 'ext:agent-manager',
    settingId: 'ext.agent-manager.setup', selector: '[data-agent-id="<id>"]' }` (the id is
    escaped): the Agents page of Setup, with that agent's card highlighted.
- Statics: `IMAGE_DEFAULTS` (the image default fields, their slot kind, issue id,
  wording and `settingId`), `CORE_OWNER`, `PROVIDERS_SETTING`
  (`aiproviders.providers`), `AGENTS_SETTING` (`ext.agent-manager.setup`) and `AGENTS_VIEW`
  (`ext:agent-manager`).
- `collect` also takes `agentManager` (optional, null without the extension).

All issues are `severity: 'error'`.

## Why

A model the user picked once and then deleted otherwise fails only when the
feature is next used. Fail soft: a throwing `getDefaults`, a failed image scan
or a failed slot read adds nothing rather than nagging. A file left on a
switched-off helper is not in anyone's way, so only an enabled helper is checked.
