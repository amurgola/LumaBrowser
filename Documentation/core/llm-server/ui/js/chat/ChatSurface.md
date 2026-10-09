# Chat surface (folder overview)

`core/llm-server/ui/js/chat/`

The LLM tab's chat (and the web PWA's, over its API shim), ported from the
legacy `ui/js/chat-mode.js`. [ChatMode](ChatMode.md) is the only class a page
uses; everything else is a component it builds.

## How the pieces talk

[ChatContext](ChatContext.md) is the shared wiring: the injected `api`, the
[ChatState](ChatState.md), the collaborators, the mounted elements (`els`), the
chat's scoped Resonant, and every component by name (`ctx.sidebar`,
`ctx.sender`, ...). Components take the context in their constructor and call
each other through it at call time, exactly where the legacy closures called
each other. Stateless helpers are static classes imported directly.

A turn: [ComposerView](composer/ComposerView.md) or a chip calls
[TurnSender](stream/TurnSender.md), which pushes the user and placeholder
messages, opens the live turn through [StreamView](stream/StreamView.md) and
calls `api.chat2`. [ChatEventRouter](stream/ChatEventRouter.md) folds every
chat event into the live message (tool and agent events through their
reducers) and schedules StreamView's 55 ms pass; the answer body itself is a
ResonantJs stream sink. [StreamFinisher](stream/StreamFinisher.md) ends it and
re-renders it statically with [TurnRenderer](turns/TurnRenderer.md).

## Folders

| Folder | Classes |
|---|---|
| `chat/` | [ChatMode](ChatMode.md), [ChatContext](ChatContext.md), [ChatState](ChatState.md), [ChatSubscriptions](ChatSubscriptions.md), [ChatIcons](ChatIcons.md) |
| `common/` | [PopoverCloser](common/PopoverCloser.md), [PopoverFit](common/PopoverFit.md), [ChatModals](common/ChatModals.md), [ShareLinks](common/ShareLinks.md), [ActionButton](common/ActionButton.md), [RunTimeText](common/RunTimeText.md), [SelectorText](common/SelectorText.md) |
| `sidebar/` | [Sidebar](sidebar/Sidebar.md), [SidebarModes](sidebar/SidebarModes.md), [ConversationList](sidebar/ConversationList.md), [ConversationGroups](sidebar/ConversationGroups.md), [ArtifactsSidebar](sidebar/ArtifactsSidebar.md), [ArtifactRowHtml](sidebar/ArtifactRowHtml.md), [SidebarFootAlignment](sidebar/SidebarFootAlignment.md) |
| `main/` | [MainColumn](main/MainColumn.md), [CodeBlockBar](main/CodeBlockBar.md), [FileDrop](main/FileDrop.md) |
| `panel/` | [ArtifactPanel](panel/ArtifactPanel.md), [PanelEditor](panel/PanelEditor.md), [PanelDocuments](panel/PanelDocuments.md), [MediaArtifactCache](panel/MediaArtifactCache.md), [ArtifactDownloader](panel/ArtifactDownloader.md) |
| `composer/` | [ComposerView](composer/ComposerView.md), [Availability](composer/Availability.md), [AttachmentStrip](composer/AttachmentStrip.md), [UserMessageComposer](composer/UserMessageComposer.md), [ThinkPill](composer/ThinkPill.md), [GearPanel](composer/GearPanel.md), [GearToolList](composer/GearToolList.md), [ModelPicker](composer/ModelPicker.md), [ContextOptionText](composer/ContextOptionText.md), [UsageMeter](composer/UsageMeter.md) |
| `turns/` | [TurnRenderer](turns/TurnRenderer.md), [UserTurnView](turns/UserTurnView.md), [AttachmentCard](turns/AttachmentCard.md), [ThinkPane](turns/ThinkPane.md), [ThinkingText](turns/ThinkingText.md), [ToolChainView](turns/ToolChainView.md), [ToolLabels](turns/ToolLabels.md), [ToolCardText](turns/ToolCardText.md), [PreviewSlot](turns/PreviewSlot.md), [TabPreviewCard](turns/TabPreviewCard.md), [AgentRunCards](turns/AgentRunCards.md), [ArtifactChips](turns/ArtifactChips.md), [LiveArtifacts](turns/LiveArtifacts.md), [RuntimeFixCard](turns/RuntimeFixCard.md), [TurnActions](turns/TurnActions.md), [TurnTimings](turns/TurnTimings.md), [AssistantTurnEditor](turns/AssistantTurnEditor.md), [ReplyChoices](turns/ReplyChoices.md), [ReplyChoiceChips](turns/ReplyChoiceChips.md), [TurnData](turns/TurnData.md) |
| `stream/` | [TurnSender](stream/TurnSender.md), [TurnFlags](stream/TurnFlags.md), [StreamView](stream/StreamView.md), [ChatEventRouter](stream/ChatEventRouter.md), [ToolEventReducer](stream/ToolEventReducer.md), [AgentEventReducer](stream/AgentEventReducer.md), [StreamFinisher](stream/StreamFinisher.md), [StatusText](stream/StatusText.md) |
| `conversation/` | [ConversationView](conversation/ConversationView.md), [LandingView](conversation/LandingView.md), [PersonaSeeds](conversation/PersonaSeeds.md), [ConversationMenu](conversation/ConversationMenu.md), [ConversationMarkdown](conversation/ConversationMarkdown.md) |
| `tasks/` | [ScheduledTaskView](tasks/ScheduledTaskView.md), [ScheduledTaskMenu](tasks/ScheduledTaskMenu.md), [TriggerView](tasks/TriggerView.md), [TriggerHeaderHtml](tasks/TriggerHeaderHtml.md), [TriggerSections](tasks/TriggerSections.md), [TriggerMenu](tasks/TriggerMenu.md), [TriggerText](tasks/TriggerText.md) |
| `modes/` | [ModeContext](modes/ModeContext.md), [ModeLauncher](modes/ModeLauncher.md), [ModePreflight](modes/ModePreflight.md), [ModeTheme](modes/ModeTheme.md), [CodeSurfaceReporter](modes/CodeSurfaceReporter.md) |
| `voice/` | [VoiceBridge](voice/VoiceBridge.md) |

## Shared library used (wave 1)

| Legacy global | Module |
|---|---|
| `LumaFmt.el` | `Dom.el` |
| `LumaFmt.bytes` (`fmtBytes`, `fmtArtBytes`) | `ByteFormatter.bytes(n, { zero: '' })` / `{ zero: '0 B' }` |
| private `esc` | `HtmlEscaper.escape` (also escapes `'`; never looser) |
| `LumaMarkdown.render`, `.parseAttachments`, `.highlight` | `MarkdownRenderer.render`, `AttachmentParser.parse`, `CodeHighlighter.highlight` |
| `LumaLiveMount.mountLiveModule`, `.declaresOwnStore`, `.makeLuma` | `LiveModuleMounter.mount`, `LiveModuleSource.declaresOwnStore`, `LumaBridge.create` |
| `LumaArtifactData.create` | `ArtifactDataStore.create` |
| `LumaMonaco.ensureLoaded`, `.languageFor`, `.resolveLanguage` | `MonacoLoader.ensureLoaded`, `MonacoLanguages.languageFor`, `.resolveLanguage` |
| `window.lumaBrowserResonant` | `ResonantRuntime.scoped(root)` |
| private `copyText` | `Clipboard.copyText` (same honest-outcome recipe) |
| `alert(...)` (Pick a model first, Could not start) | `Dialogs.alert` |

## Behaviour changes (bug fixes, each with a test)

- Sub-agent cards now appear while a turn streams. Legacy `syncAgentCards(el, m)`
  shadowed the `el` factory with its turn-element parameter and threw
  "el is not a function" the first time a run needed its box.
- The streaming pulse now stays until the first token. Legacy reset the draft
  through the Resonant setter, whose deferred re-render wiped the pulse a tick
  after it was painted.
- A cached video or audio thumbnail now paints on a re-render. Legacy guarded
  the cached paint with `wrap.isConnected`, false for a node being built, so it
  stayed a skeleton.
- New chat now calls the outgoing mode's `onLeaveConversation`. Legacy reset the
  active mode before `leaveActiveMode` ran, so the hook never fired from there.
- The trigger runs view expands the newest RUN. Legacy expanded the first
  `.cm-run`, which is the memory box or a version row when those show.
- The code-block bar's hide also forgets the block it was over, so it re-shows
  over the same block.
