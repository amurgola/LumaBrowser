# ChatSurface

`core/shell/extensions/ChatSurface.js`

`context.chat`: chat modes plus server-side image and text helpers for mode reactions.

## Methods

- `new ChatSurface({ registry, images, vram, warmer, imageRouter, imageService, llmService, chatRouter, lab })`,
  all optional (tests). Defaults: `ChatModeRegistry.shared`, a [ChatImageGenerator](ChatImageGenerator.md),
  `ImageVramMediator.shared`, an [ImageSlotWarmer](ImageSlotWarmer.md), [ExtensionGlobals](ExtensionGlobals.md), `LabHarness.current`.
  `key` is `chat`.
- `forExtension(id, manifest?)` ->
  - `registerMode(descriptor)`, `unregisterMode(modeId)`, `listModes()` (modes owned by the extension);
    a descriptor whose `chatUiUrl` is the manifest's own `chatUi` bundle gets `chatUiModule` set the same
    way [ExtensionWiring](ExtensionWiring.md) sets it for `manifest.chatModes` (bundled = ES module), so modes
    registered from `activate()` (agent-manager, code-mode, game-mode, roleplay-mode) load their module entry;
  - `uiUrl(relPath)` ([ExtensionUrls](ExtensionUrls.md));
  - `generateImage(opts)`, `abortImage()`;
  - `complete(opts)` one-shot completion through the chat router; resolves the
    router's reply, `{ error: 'chat completion unavailable' }` without a router,
    or `{ error: <message> }`; an active Lab `completeMock` answers first;
  - `visionAvailable(modelRef?)` ([VisionAvailability](VisionAvailability.md));
  - `beginExclusiveImage()`, `endExclusiveImage()` ([ImageVramMediator](ImageVramMediator.md));
  - `isImageReady()` `isRoleReady('image-generate')`, or on older cores
    `isEnabled()` plus default runtime and model; false on error;
  - `imageNativeSize(modelRef?)` the router's `getModelNativeSize`, or null; never starts a server;
  - `warmImageSlot(slot, modelRef?)`.
