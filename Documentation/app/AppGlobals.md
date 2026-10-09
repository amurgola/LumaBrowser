# AppGlobals

`app/AppGlobals.js`

The one list of singletons the app publishes on `global`, for code that must
not take a constructor dependency on them (extensions, the chat bridge, the
sharing host, e2e harnesses).

## Methods

- `AppGlobals.NAMES`: every name the app sets: `__LUMA_BOOT_START`,
  `__lumaCliHandshake`, `__lumaRagService`, `__lumaDocsKnowledgeBase`, `__lumaLlmServerService`,
  `__lumaImageServerService`, `__lumaGroundingServer`, `__lumaImageRouter`,
  `__lumaVideoRouter`, `__lumaMusicRouter`, `__lumaRpcLending`,
  `__lumaSharingHostService`, `__lumaSharingClientService`,
  `__lumaLocalApiServer`, `__lumaPlacementService`, and at window time
  `__lumaTabPreview`, `__lumaOnDemand`, `__lumaResolutionCache`,
  `__lumaVisualGrounding`, `__lumaDesktop`, `__lumaGames`, and on first use
  `__lumaRuntimeTracer`.
- `AppGlobals.publish(name, value, target = global)` sets and returns the value;
  throws `AppGlobals: unknown global <name>` for an unlisted name.
- `AppGlobals.read(name, target = global)` the value or null.

Set elsewhere, never here: `__lumaChatRouter` (UnifiedChatRouter publishes itself), `__lumaAgentManager` (agent-manager), `__lumaRpLabService` (roleplay-mode) and `__lumaImageAbortSeq` (the image pipelines' own counter).
