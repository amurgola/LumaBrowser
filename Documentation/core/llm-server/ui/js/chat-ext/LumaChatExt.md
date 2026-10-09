# LumaChatExt

`core/llm-server/ui/js/chat-ext/LumaChatExt.js`

`window.LumaChatExt`, the chat-extension contract of the LLM tab. The chat shell
loads mode bundles through it; bundles (first-party and third-party add-ons)
register their client hooks on it and borrow its form and image helpers. The
global name and every method are a contract: identical to legacy `chat-ext.js`.

## Installing

`LumaChatExt.install(win = window)` creates the instance and sets
`window.LumaChatExt` once (idempotent: a second call returns the first
instance). The LLM tab entry calls it before anything that registers a mode
(the core `scheduled-task` and `trigger` modes, then the chat shell's `load`).
Every public method is bound, so `const { registerMode } = window.LumaChatExt`
works as it did with legacy's plain object.

## Public API (unchanged from legacy)

| Method | Does |
|---|---|
| `load(api)` | Once per page: `api.chat.listModes()`, stores each backend descriptor, injects each mode's `chatUiUrl` bundle (see "Loading bundles"), resolves `list()`. A failing or missing `listModes` gives `[]` and logs `[chat-ext] listModes failed:`. |
| `registerMode(def)` | Called by a bundle when it runs. `def.id` is required (else `[chat-ext] registerMode requires an object with an id` is logged). Later registrations of the same id replace earlier ones. |
| `getBackend(id)` / `getClient(id)` | The backend descriptor / the registered hooks, or `null`. |
| `getMerged(id)` | `{ ...backend, ...client, id }`, or `null` until the backend lists the mode. |
| `list()` / `hasModes()` | Backend descriptors in listing order / whether there are any. |
| `openSchemaModal(schema, opts)` | Schema form in an overlay. Resolves the collected data, or `null` on Cancel or a backdrop click. `opts: { api?, initial? }`; `api` defaults to `window.llmDiagAPI`, `initial` is deep-copied. |
| `openSchemaInline(schema, opts)` | The same form inside `opts.host` (class `luma-modal--inline`); without `host` it is the modal. |
| `generateImage(api, opts)` | One image over `api.image.generate` / `onImageEvent`. Always resolves `{ b64, mime }` or `{ error }`, never `null`; 20 minute safety timeout. |
| `attachAssist(input, field, opts)` | The AI-fill button on a standalone `<input>`/`<textarea>` already in the DOM. `field: { key?, assist, assistClean?, assistTitle? }` (key defaults to `_value`); `opts: { api?, model?, statusHost?, rootModel?, siblingModel? }`. Returns the model the value is mirrored into. |

## Client hooks a bundle may register (all optional)

- `preflight(api)` returns `{ ok, missing?: [{ requirement, message, fixAction? }] }`.
- `openSetup(api, ctx)` resolves the conversation's `meta.data`, or `null` if
  cancelled. `ctx.setupHost()` (when the chat shell provides it) swaps the
  conversation area for an inline setup view and returns its host element:
  pass it to `openSchemaInline`.
- `startConversation(api, ctx, data)`: `ctx.sendTurn(text)`, `ctx.refresh()`,
  `ctx.conversationId`.
- `decorateComposer(els, ctx)`: `els.bar`, `els.textarea`.
- `renderTurnExtras(el, msg, ctx)`, `onChatEvent(evt, ctx)` (mode-scoped `mode:*`
  events), `applyTheme(rootEl, meta)`, `onOpenConversation(meta, ctx)`.
- `onLeaveConversation(ctx)`: tear down anything mounted outside the thread.
  Body overlays should carry `[data-cm-overlay]` so they hide on Setup.

## Loading bundles (rule for wave-2 extension porters G1-G3)

`load` injects one `<script>` per distinct `chatUiUrl`, in listing order
(`async = false`), and resolves when each has loaded or failed (a failing
bundle logs `[chat-ext] failed to load mode bundle: <url>` and never blocks the
page). The script kind comes from the listed descriptor
([ChatUiScriptLoader](ChatUiScriptLoader.md)):

- `descriptor.chatUiModule === true`: `<script type="module">`. This is for a
  **bundled extension without `distributable: true`** (code-mode, game-mode,
  agent-manager). Its `chat-ui.js` is a thin module entry that imports its
  classes from `./ui/` and registers through the global:
  `window.LumaChatExt.registerMode({ id, ... })`. Register at module top level
  (module scripts run before their `load` event, so the mode is registered when
  `load` resolves). Do not import `chat-ext/` classes: the global is the
  contract and the only shared instance.
- anything else: a classic script. This covers **user-installed add-ons** and
  **`distributable: true` extensions** (roleplay-mode): one self-contained
  classic file that reads `window.LumaChatExt` synchronously.

Who sets `chatUiModule`: the main process, from the manifest. Until that change
request is done (see NOTES in the wave report: ExtensionWiring stamps
`chatUiModule: !manifest._userInstalled && manifest.distributable !== true`
next to `chatUiUrl`, and `ChatModeRegistry._toListed` passes it through),
every bundle loads classic. SharedAgents (the PWA's agent chat) copies the
descriptor, so the flag reaches the web client too.

## Schema fields

`type`: `text`, `number`, `textarea`, `select`, `toggle`, `button`, `group`,
`image`, `charart`, `repeater` (see [SchemaFieldRenderer](SchemaFieldRenderer.md)
and the field docs in `fields/`). Common keys: `key`, `label`, `hint`,
`required`, `half`, `placeholder`, `showIf: { key, equals } | { key, in } | { key }`.
`label`, `hint`, `title` and `subtitle` are schema-authored markup inserted as
HTML, as in legacy.

## Globals

Writes `window.LumaChatExt` (install). Reads `window.llmDiagAPI` (default api).

## Collaborators

Built from [ChatExtRegistry](ChatExtRegistry.md) (modes and loading) and
[SchemaPresenter](SchemaPresenter.md) (forms); uses
[AssistField](AssistField.md), [ImageGenerator](ImageGenerator.md) and
[ChatExtStyles](ChatExtStyles.md).
