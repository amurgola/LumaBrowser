# ExtensionManager

`core/shell/ExtensionManager.js`

Discovers extensions, resolves their dependencies, activates each with an
injected `context`, and manages them at runtime (enable, disable, hot install,
delete). A facade over the classes in [extensions/](extensions/); callers keep
the legacy public API.

## Methods

- `new ExtensionManager({ extensionsDir, userExtensionsDir, coreServices, ipcBridge, restGateway, mcpAggregator, registries?, chat? })`.
  Creates `userExtensionsDir` if missing. `coreServices` is kept by reference
  (main.js sets `coreServices.browser` after construction). Keys read:
  `database`, `llm`, `browser`, `activityLog`, `ttsServer`,
  `sttServer`, `llmServer`, plus any other key a manifest names as `core:<key>`.
  `registries` (see [ExtensionTeardown](extensions/ExtensionTeardown.md)`.sharedRegistries`)
  and `chat` (a ChatSurface) are test overrides.
- Public state: `extensionsDir`, `userExtensionsDir`, `coreServices`,
  `ipcBridge`, `restGateway`, `mcpAggregator`; read-only getters `manifests`
  (Map id -> manifest), `extensions` (Map id -> `{ manifest, instance, api }`),
  `loadOrder` (array, mutated in place), `unmetDeps` (Map id -> dep key),
  `disabledSet` (Set).
- `discover()` scans the bundled dir then the user dir; returns `manifests`.
- `resolve()` returns the ids that can load, in order (see [DependencyResolver](extensions/DependencyResolver.md)).
- `activate()` re-reads the disabled setting (re-resolving if it changed), then
  activates every resolved extension, yielding to the event loop between them.
  A failure is recorded in `getErrors()` with phase `activation`; the extension
  stays inactive but not disabled.
- `disableExtension(id)` / `enableExtension(id)` resolve `{ success, id? , error? }`.
  Disable refuses an inactive id or one an active extension requires; enable
  refuses an unknown or already active id, or one whose required extensions are
  inactive. Enable is keyed off the active set, so a boot-failed extension can be enabled.
- `isDeletable(id)` true only for user-installed extensions.
- `deleteExtension(id)` ([ExtensionRemover](extensions/ExtensionRemover.md)), `hotInstallExtension(dir)` ([HotInstaller](extensions/HotInstaller.md)).
- `getCapabilitiesSnapshot(excludeId?)`, `getToggleConstraints()`,
  `getRendererExtensionList()`, `getRendererSource(id)`.
- `getApi(id)`, `getExtension(id)` (null when inactive), `getErrors()`.
- `codeSurfaceFor(extensionId)` the `context.code` object for an id outside
  activation (for code-mode tests).
- `deactivate()` runs every `deactivate()` in reverse load order and clears the active set.

## The context

`activate(context)` receives: `extensionId`, `extensionDir`, `browser`, `llm`
(each null unless declared as `core:browser`, `core:llm-service`), `db` (a DatabaseService on `ext.<id>` limited to the
`core:database` tables declared, or null), `sharedServices`, `ipc`, `logger`,
`extensions` (APIs of declared, active extension deps) plus a `context['<dep>']`
shortcut for each, `events`, `expose`, and the surfaces `chat`, `setupTab`,
`imageCatalog`, `llmCatalog`, `voice`, `code`. See
[ExtensionContextFactory](extensions/ExtensionContextFactory.md).

## Parts

- State: [ExtensionLedger](extensions/ExtensionLedger.md), [DisabledExtensions](extensions/DisabledExtensions.md).
- Manifests: [ManifestScanner](extensions/ManifestScanner.md), [ManifestValidator](extensions/ManifestValidator.md),
  [ManifestDeps](extensions/ManifestDeps.md), [ManifestFields](extensions/ManifestFields.md),
  [DependencyResolver](extensions/DependencyResolver.md), [LoadPriority](extensions/LoadPriority.md).
- Lifecycle: [ExtensionActivator](extensions/ExtensionActivator.md), [ExtensionWiring](extensions/ExtensionWiring.md),
  [McpToolSetMerger](extensions/McpToolSetMerger.md), [ExtensionTeardown](extensions/ExtensionTeardown.md),
  [HotInstaller](extensions/HotInstaller.md), [ExtensionRemover](extensions/ExtensionRemover.md),
  [RequireCacheBuster](extensions/RequireCacheBuster.md), [RendererBroadcast](extensions/RendererBroadcast.md).
- Context: [ExtensionContextFactory](extensions/ExtensionContextFactory.md), [ExtensionEventBus](extensions/ExtensionEventBus.md),
  [ContextSurface](extensions/ContextSurface.md) and its surfaces [ChatSurface](extensions/ChatSurface.md),
  [SetupTabSurface](extensions/SetupTabSurface.md), [ImageCatalogSurface](extensions/ImageCatalogSurface.md),
  [LlmCatalogSurface](extensions/LlmCatalogSurface.md), [VoiceSurface](extensions/VoiceSurface.md),
  [CodeSurface](extensions/CodeSurface.md); chat helpers [ChatImageGenerator](extensions/ChatImageGenerator.md),
  [ImageGenerationRun](extensions/ImageGenerationRun.md), [ImageVramMediator](extensions/ImageVramMediator.md),
  [ImageSlotWarmer](extensions/ImageSlotWarmer.md), [VisionAvailability](extensions/VisionAvailability.md),
  [ExtensionGlobals](extensions/ExtensionGlobals.md), [ExtensionUrls](extensions/ExtensionUrls.md),
  [LlmRuntimesView](extensions/LlmRuntimesView.md).
- Queries: [ToggleConstraints](extensions/ToggleConstraints.md), [CapabilitiesSnapshot](extensions/CapabilitiesSnapshot.md),
  [RendererExtensionList](extensions/RendererExtensionList.md), [ManifestHtmlFiles](extensions/ManifestHtmlFiles.md),
  [RendererSource](extensions/RendererSource.md).

## Why

Extensions only ever receive what their manifest declared: an undeclared core
service is null, `db` refuses undeclared tables, LLM slots come only from a
required `core:llm-service` declaration, and a missing required core service
keeps the extension from loading at all. Bundled extensions are scanned first
so a sideloaded add-on can never shadow a first-party id, and only folders
strictly inside the user extensions dir can be deleted.
