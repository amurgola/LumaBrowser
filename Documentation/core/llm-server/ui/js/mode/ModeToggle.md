# ModeToggle

`core/llm-server/ui/js/mode/ModeToggle.js`

The LLM tab's top-level Setup / Chat / Code slider. It shows one surface,
mounts the chat and the editor lazily, persists Setup or Chat (never Code: it
belongs to one conversation), and follows deep links and switch requests.

## Methods

- `new ModeToggle({ doc?, win?, api? (window.llmDiagAPI), chatMode, codeEditor, setupNav })`.
- `start()`: finds `#modeSlider` (with `button[data-mode]`), `#setupRoot`,
  `#chatRoot`, `#codeRoot`; wires events; boots. Resolves after boot.
- `applyMode(mode, persist)`: Code without an open folder conversation becomes
  Chat. Toggles `hidden` on the roots, `body.chat-mode` (Chat only, so chat's
  body overlays stay hidden on Code), `body.code-split` (Code with the chat
  docked), mounts on first use, calls `api.setUiMode` when persisting, and
  dispatches `luma-mode-changed` (detail: the mode).
- `openSetupPage(view)`: Setup, then `setupNav.go(view)`.
- `setSetupNav(setupNav)`, `current`.

Boot: `api.getUiMode()` (fallback setup) without persisting; then a
`#setup[/<view>]` hash opens that page, `#chat` opens Chat; on Setup, a pending
`consumePendingSetupExpand() === 'plan'` opens the plan explainer.

## Collaborators

- `chatMode`: `{ mount(root, api), show(), hide() }` (legacy `window.LumaChatMode`, ported by A1).
- `codeEditor`: `{ mount(root, api), show(conversationId), hide(), wantsChatDock() }` ([CodeEditor](../code/CodeEditor.md)).
- `setupNav`: `{ go(view) }` (legacy `window.LumaSetupNav` from setup.js).
- `api`: `getUiMode`, `setUiMode`, `onShowChat(cb)`, `onShowSetup(cb({ page?, expand? }))`, `consumePendingSetupExpand`.
- Window events in: `hashchange`, `luma-switch-mode` (detail setup/chat/code),
  `luma-code-surface` (detail `{ available, conversationId, root }` from the
  chat shell on every conversation open and leave; gates the Code pill),
  `luma-code-dock`. Out: `luma-mode-changed`.
- [SetupDeepLink](SetupDeepLink.md), [PlanExplainerOpener](PlanExplainerOpener.md).

## Globals

Reads `window.llmDiagAPI` (default api) and `location.hash`. Writes none.
