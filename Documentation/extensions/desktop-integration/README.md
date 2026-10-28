# Desktop Integration

`extensions/desktop-integration/`

A local REST API under `/api/desktop` that programs on the same computer use
to work with Luma: push OS notifications in, read a glance summary, open URLs
and searches, hand content to the chat, run file actions, read job progress.
It is client-agnostic: Windhawk mods (`integrations/windhawk/`) are one kind of
client; AutoHotkey, PowerToys, shell scripts and anything else that speaks HTTP
are others. Nothing in Luma knows which client is calling beyond the name it
reports in `X-Luma-Client`.

The API is a set of **feature modules**, one folder each under
`extensions/desktop-integration/features/<id>/`, discovered at activation. The
extension itself owns only discovery, auth, the handshake file, client
bookkeeping, the settings tab and a few shared services; every endpoint beyond
`/hello` belongs to a feature.

This page is the contract for both sides: clients (sections 1 to 4) and
feature modules (sections 5 to 8).

## 1. Discovery: the handshake file

While Luma runs with the extension on and the REST API enabled
(Settings > API), it keeps `~/.lumabrowser/desktop.json`
(`%USERPROFILE%\.lumabrowser\desktop.json`; the `LUMA_DESKTOP_HANDSHAKE`
environment variable overrides the path):

```json
{
  "port": 3000,
  "token": "dsk_<48 hex>",
  "pid": 12345,
  "version": "2.0.4",
  "apiBase": "/api/desktop",
  "features": ["ping", "glance"],
  "writtenAt": "2026-10-23T10:00:00.000Z"
}
```

- Written atomically (temp file + rename) once the gateway's routes mount, and
  rewritten whenever the token rotates or a feature is switched on or off.
- `features` lists the features that are enabled **and** started; a client
  can skip calling a feature that is not listed.
- `pid` is the Luma main process; a client may check it is alive before
  connecting, and pass it to `AllowSetForegroundWindow` before a request that
  brings Luma to the front (section 4).
- Removed when the extension deactivates or the app quits, but only while the
  file still holds the token this instance wrote (a newer instance's file
  survives).
- **Clients re-read it per request** (or whenever its modification time
  changes). Then Luma restarts, port changes and token rotations need nothing
  from the client.

Base URL: `http://127.0.0.1:<port><apiBase>`. The server only answers on
loopback unless the user widened Settings > API > network mode.

## 2. Requests

| Header | Value |
| --- | --- |
| `X-Luma-Desktop-Token` | the handshake `token` (preferred) |
| `Authorization` | `Bearer <token>`, accepted too |
| `X-Luma-Client` | `<name>/<version>`, e.g. `windhawk-luma-glance/1.0`, `ahk-hotkeys/0.3` |
| `Content-Type` | `application/json` for bodies (limit 50 MB) |
| `X-API-Key` | only when Settings > API "Require API key" is on (the gateway checks it before this extension sees the request) |

The token is compared in constant time. Use `X-Luma-Desktop-Token` when
`Authorization` already carries the gateway API key.

`X-Luma-Client` is optional but recommended: the settings tab lists every
client seen since launch (last seen, request count, features used).

### Unguarded

`GET /api/desktop/hello` -> `{ success: true, name: 'LumaBrowser', apiBase: '/api/desktop', version }`.
No token, no secrets: lets a client tell Luma is up.

### Everything else needs the token

- Missing or wrong token: `401 { success: false, error }`.
- `GET|POST ... /api/desktop/<feature>/...` routes to that feature's router.
- A feature that exists but is switched off (or failed to start):
  `404 { success: false, error: 'Feature disabled', feature: '<id>' }`.
- An unknown feature: `404 { success: false, error: 'Unknown feature', feature: '<id>' }`.
- A path the feature does not serve: `404 { success: false, error: 'Not found', feature }`.
- A feature handler that throws: `500 { success: false, error: <message>, feature }`.

## 3. Response envelope

Every JSON answer is `{ success: true, ...payload }` or
`{ success: false, error: '<message>', ...details }`, with an HTTP status that
matches (2xx for success; 400 for bad input; 404, 401, 500 as above). Features
must keep to it.

## 4. Writing a client

- Read the handshake; if it is missing, Luma is not running (or the extension
  or the REST API is off). Do not retry in a tight loop.
- Keep timeouts short: connect 500 ms, whole request about 3 s. Luma is local;
  a slow answer means it is busy or gone.
- Never block a UI thread on a request.
- Before a request that raises Luma's window (chat handoff, open URL), call
  `AllowSetForegroundWindow(<handshake pid>)` from the process that owns the
  foreground; otherwise Windows may only flash Luma's taskbar button.
- Windhawk mods embed `integrations/windhawk/_shared/luma_client.inc.cpp`, which
  does all of the above (see `integrations/windhawk/README.md`).

Example (PowerShell):

```powershell
$h = Get-Content "$env:USERPROFILE\.lumabrowser\desktop.json" | ConvertFrom-Json
Invoke-RestMethod "http://127.0.0.1:$($h.port)$($h.apiBase)/ping/" -Headers @{ 'X-Luma-Desktop-Token' = $h.token; 'X-Luma-Client' = 'powershell/1' }
```

## 5. Feature modules

A feature is a folder `extensions/desktop-integration/features/<id>/` with an
`index.js`. Adding one needs no edit anywhere else: the folder is found by
`fs.readdirSync` at activation, its switch appears in the settings tab, its
routes mount at `/api/desktop/<id>`, and its id joins the handshake's
`features` while it is on.

```js
module.exports = {
  id: 'glance',                 // = the folder name; lowercase letters, digits, dashes; not 'hello'
  label: 'Glance',              // settings tab title
  description: 'One line for the settings tab',
  defaultEnabled: true,         // until the user flips the switch (then the choice persists)
  create(deps) {                // called when the feature starts (activation, or switched on)
    return {
      mount(router) {           // an express.Router mounted at /api/desktop/<id>
        router.get('/', (req, res) => res.json({ success: true }));
      },
      dispose() {},             // optional: switched off or extension deactivating
    };
  },
};
```

Rules:

- Folders whose name starts with `_` or `.` are ignored (use `_shared` style
  names for helpers that are not features); a folder without `index.js` is
  ignored.
- A folder that throws on `require`, breaks the contract (bad id, id not equal
  to the folder, no `create`) or whose `create`/`mount` throws is logged,
  shown in the settings tab with its error, and skipped. It never stops the
  other features or the extension.
- `create` runs again every time the feature is switched on; `dispose` must
  undo what `create` started (timers, subscriptions). IPC channels registered
  through `deps.ipc` are removed for you.
- Request bodies are already parsed JSON (`req.body`). Validate them and
  answer `400 { success: false, error }` for bad input.
- Keep state in memory or in `deps.settings` (key-value). A feature that needs
  SQL tables lists them in `features/<id>/tables.js`
  (`module.exports = ['desktop_<id>_items']`; names must match
  `desktop_[a-z0-9_]+`); the manifest reads every such file, so the tables are
  declared on `core:database` and `deps.db.query/run` may use them. Create them
  yourself (`CREATE TABLE IF NOT EXISTS`) in `create`. Remember the
  DatabaseService table scanner quirk: avoid `ON CONFLICT ... DO UPDATE SET`.
- User settings: export an optional `settingsSchema` array next to `create`:
  `[{ key, label, type, default, help?, options?, min?, max?, step? }]` with
  `type` one of `text`, `textarea`, `number`, `bool`, `select`
  (`options: [{ value, label }]`) or `hotkey` (an accelerator string, empty =
  off). The settings tab renders the fields under the feature's card and stores
  values in `deps.settings` under the same keys, coerced to the field type
  ([FeatureSettingsSchema](FeatureSettingsSchema.md)); read them with
  `deps.settings.get(key, default)`. If the object `create` returned has
  `onSettingsChanged(key, value)`, it is called after each change (a throw
  there is logged; the value stays saved).
- Docs: `Documentation/extensions/desktop-integration/features/<id>/index.md`
  (and one per extra file). Index lines go under the
  `<!-- desktop-integration-features -->` marker in `Documentation/index.md`.

## 6. The `deps` object

Built per feature by [FeatureDeps](FeatureDeps.md):

| Key | What |
| --- | --- |
| `id` | the feature id |
| `db` | the extension's [DatabaseService](../../core/database/DatabaseService.md): key-value `get/set/delete/getAll` under `ext.desktop-integration.*`, SQL on declared tables, `getRawDb()` |
| `settings` | [FeatureSettings](FeatureSettings.md), this feature's own key-value store: `get(key, default)`, `set(key, value)`, `delete(key)`, `all()` (stored at `ext.desktop-integration.feature.<id>.<key>`) |
| `ipc` | IPC scoped to the feature: `handle(channel, fn)`, `on(channel, fn)`, `send(win, channel, data)` land on `ext.desktop-integration.<id>.<channel>`; `channelPrefix`; removed when the feature stops |
| `broadcast(type, payload)` | tells every renderer: Dashboard and live modules get `<id>.<type>` on `ext.desktop-integration.dashboard.event`; the settings tab gets `{ type: '<id>.<type>', feature, payload }` on `ext.desktop-integration.changed` |
| `extensions` | other extensions' public APIs, read live (getter). Declared as optional dependencies, so any may be missing: always check. See section 7 |
| `handoff` | [ChatHandoff](shared/ChatHandoff.md) |
| `speech` | [Speech](shared/Speech.md): also `pause()`, `resume()`, `playback()`, `onState(fn)` |
| `overlay` | [ActivityOverlay](shared/ActivityOverlay.md): the desktop ring and island (`show(state, onAction)`) |
| `hints` | [HintContributions](shared/HintContributions.md): add keys to the Ctrl+Alt+Shift shortcut hint (`add(featureId, provider)`) |
| `shortcuts` | [GlobalShortcuts](shared/GlobalShortcuts.md): the global-shortcut backend to register on (`register(accelerator, callback)`, `unregister`): Electron, or the X11 bridge while it runs on Wayland; pass it to [HotkeyBindings](features/hotkeys/HotkeyBindings.md) as its `globalShortcut` |
| `bridge` | the extension's [X11Bridge](features/hotkeys/X11Bridge.md) on a Linux Wayland session with XWayland, else null; the hotkeys feature starts and stops it |
| `windows` | [AppWindows](shared/AppWindows.md): `getMainWindow()` (Electron BrowserWindow or null), `focusMainWindow()` (restore, show, raise; true when done) |
| `browser` | the core BrowserService (`context.browser`) or null: `createTab(url, { kind: 'user' })`, `getMainWindow()`, tab queries |
| `services` | `context.sharedServices`: `database`, `llm`, `browser`, `ttsServer`, `sttServer`, `activityLog`, `identity`, `dashboard` (DashboardService, `ensureTab({ activate })`; a live getter), ... (raw core services; prefer the shared services above) |
| `clients` | the [ClientRegistry](ClientRegistry.md) (`list()`) |
| `features` | `{ enabled(): string[], isEnabled(id): boolean }` |
| `log` | `{ info, warn, error, debug }(message, details?)`, lines tagged `desktop-integration/<id>:` in the activity log |
| `appInfo` | `{ name: 'LumaBrowser', version, platform, apiBase, handshakePath, port }` (`port` is read live; null until the routes mount) |

Main-process singletons that are not in `deps` are reachable the way other
extensions reach them: `require('../../../../core/shell/extensions/ExtensionGlobals')`
(`llmServerService()`, `chatRouter()`, `imageServerService()`), `global.__lumaDesktop`
(DesktopService: desktop automation), `require('electron')` (`shell`,
`clipboard`, `Notification`, `BrowserWindow`, `app`).

## 7. Other extensions in `deps.extensions`

Declared optional in the manifest, so present only while installed and enabled:

- `personal-hub` (the Hub), every HubService method by name, including
  `pushQueueItem(item)` (adds a notification to the conversation queue:
  `{ app, threadKey?, title, summary, priority, participants, url, labels, context, body, sender, at }`, see [InboxService](../personal-hub/inbox/InboxService.md)), `listThreads({ state, app, limit })`,
  `getThread(id)`, `setThreadState(id, state, { snoozeUntil })`, `listNotifications({ since, limit })`,
  `listEvents({ days } | { from, to })`, `listCalendarSources()`, `listColumns()`,
  `listTasks({ columnKey, sourceId, includeHidden })`, `getTask(id)`, `createTask(input)`,
  `updateTask(id, patch)`, `moveTask(id, columnKey, opts)`, `syncNow()`, `syncStatus()`,
  `openUrl(url)`, `listConnections()`; plus `inboundInfo()`. See
  [HubService](../personal-hub/HubService.md) for shapes.
- `notification-interceptor`: `getLog()`, `getCount()`, `onIngest(cb)` (returns
  an unsubscribe; call it in `dispose`), `getWebhookUrl()`, `setWebhookUrl(url)`.
- `timed-tasks`: `getAllTasks()`, `getTask(id)`, `getTaskRuns(id, limit, offset)`,
  `getRun(runId)`, `triggerNow(id, { silent })`, `createTask(data)`, `updateTask`,
  `setEnabled`, `deleteTask`.
- `ai-chat`: `run(options)`, a headless agent turn (not shown in the chat UI).

## 8. Shared services

### ChatHandoff

`deps.handoff.open({ prompt, attachments, autoSend, source }) -> Promise<{ success, conversationId, autoSent, attached, rejected } | { success: false, error }>`

- Raises Luma (the window that shows the chat tab), switches the pinned chat
  tab to chat and opens a **new** conversation with `prompt` in the composer and
  the attachments staged, through the chat's one-shot intent
  ([ComposeIntent](../../core/llm-server/ui/js/chat/modes/ComposeIntent.md)); a
  chat tab that is still loading picks it up when ready.
- `attachments`: up to 10 of `{ kind: 'text'|'image'|'file', name, mime, data (base64) | path | text }`.
  `text` takes `text` (or base64 `data`); `image` takes base64 `data`
  (PNG, JPEG, GIF, WebP; 8 MB); `file` takes base64 `data` or a local `path`
  and is read like a dropped file: text and code as text (200 KB), PDFs as
  extracted text (20 MB), images by extension. Other binary files are rejected.
  Rejected items come back in `rejected: [{ name, error }]`; the rest still go.
- `autoSend: true` creates the conversation first (so `conversationId` is
  returned) and sends the turn. Without a model ever picked, the prompt is only
  filled in (`autoSent: false`). Without `autoSend`, `conversationId` is null:
  the conversation only exists once the user sends.
- `source: { client, app, windowTitle }` is kept with the intent; an auto-sent
  conversation is titled `From <app>` until the first reply renames it.
- It is the pinned LLM tab's chat (the full chat with attachments), not the
  ai-chat side panel.

### Speech

- `deps.speech.available() -> boolean`: a TTS runtime and at least one voice installed.
- `deps.speech.speak(text, { voice? }) -> Promise<{ success, utteranceId, chunks, canceled } | { success: false, error, code? }>`:
  synthesizes with the app's TTS (`ttsServer`: built-in sherpa voices such as
  KittenTTS, or an extension engine such as Chatterbox), sentence by sentence,
  and plays it in the main window through the chat's own PCM player. Resolves
  when synthesis is done (playback may still run). One utterance at a time; a
  new `speak` cuts the previous one off. Text over 4000 characters is cut.
  `voice` is a speaker index (sid) of the current default voice model; voice
  model ids are not switchable per call (the default voice is a global
  setting). Codes: `NO_TTS`, `NO_TTS_MODEL`, `TTS_RUNTIME_MISSING`.
- `deps.speech.stop() -> { success, stopped }`.
- It does not coordinate with the chat's read-aloud or voice mode.

## 9. Files

- [DesktopIntegrationExtension](DesktopIntegrationExtension.md) (also `manifest.js`, `main.js`, `routes.js`, `renderer.js`)
- [DesktopRoutes](DesktopRoutes.md), [DesktopToken](DesktopToken.md), [DesktopHandshake](DesktopHandshake.md), [ClientRegistry](ClientRegistry.md)
- [FeatureCatalog](FeatureCatalog.md), [FeatureRegistry](FeatureRegistry.md), [FeatureDeps](FeatureDeps.md), [FeatureSettings](FeatureSettings.md)
- [DesktopBroadcast](DesktopBroadcast.md), [DesktopIpcHandlers](DesktopIpcHandlers.md)
- [shared/ChatHandoff](shared/ChatHandoff.md), [shared/Speech](shared/Speech.md), [shared/AppWindows](shared/AppWindows.md)
- [ui/DesktopRenderer](ui/DesktopRenderer.md), [ui/DesktopSettingsTab](ui/DesktopSettingsTab.md), [ui/SpeechPlayer](ui/SpeechPlayer.md)
- [features/ping](features/ping/index.md)
- [features/lumabyte](features/lumabyte/index.md): attach Luma to any window, a docked button and a grounded panel
- [features/agent-run](features/agent-run/index.md): pause, continue or stop the agent's desktop run and answer its approvals from any app; the run on the ring and island
