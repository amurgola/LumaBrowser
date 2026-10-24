# LumaBrowser Windhawk mods

[Windhawk](https://windhawk.net) mods that connect Windows itself (the taskbar,
the tray, Explorer) to LumaBrowser through Luma's **Desktop Integration** API.
They are ordinary desktop clients of that API: anything a mod does, a script
or another tool could do too. The API contract lives in
`Documentation/extensions/desktop-integration/README.md`.

| File | What |
| --- | --- |
| `luma-notification-relay.wh.cpp` | Sends every Windows toast to Luma's `notifications` feature (Personal Hub queue). Reads them with UserNotificationListener from Explorer. |
| `luma-taskbar-glance.wh.cpp` | Shows the `glance` line (next event, unread, due, job progress) on the Windows 11 taskbar clock and tooltip; middle-click opens the Hub. GPL-3 (adapted from taskbar-clock-customization). |
| `luma-ask-window.wh.cpp` | Adds "Ask Luma about this window" to every app's window menu (title bar right-click, Alt+Space); the `ask` feature captures the window into a chat. |
| `luma-link-redirect.wh.cpp` | Sends Edge-forced links (Start search, widgets, `microsoft-edge:`) to Luma's `open` feature; falls back to Edge when Luma is not running. |
| `luma-explorer-actions.wh.cpp` | Adds a "Luma" submenu to Explorer's classic context menu, filled from the `file-actions` feature. |
| `luma-desktop-ping.wh.cpp` | Logs whether Luma answers. The template for new mods. |
| `_shared/luma_client.inc.cpp` | The canonical client block every mod embeds. |

## Requirements

- LumaBrowser running, with Settings > API on and Settings > Extensions >
  Desktop Integration on (with the features the mod uses switched on).
- Windhawk 1.5 or newer.

## Installing a mod

Windhawk mods are single source files that Windhawk compiles itself.

1. **From Luma (one click)**: Settings > General > Windhawk lists every mod
   here with Install, Update and Remove. Luma compiles the mod with
   Windhawk's own compiler and registers it as the local mod
   `local@<id>` (Windows asks for administrator approval once per click);
   Windhawk loads it right away. See
   `Documentation/core/shell/WindhawkModInstaller.md`.
2. **From the editor**: Windhawk > Create a new mod, replace the template with
   the whole `.wh.cpp` file, then Compile and Enable (Exit editing mode when
   done).
3. **Or copy the file**: put the `.wh.cpp` file in
   `%ProgramData%\Windhawk\ModsSource\` (keep the file name equal to its
   `@id`, e.g. `luma-desktop-ping.wh.cpp`), restart Windhawk, open the mod and
   Compile.

The mod's log (Windhawk > the mod > Advanced > Debug logging) shows what it does.

## How a mod finds Luma

Luma writes `%USERPROFILE%\.lumabrowser\desktop.json` while it runs:

```json
{ "port": 3000, "token": "dsk_...", "pid": 12345, "version": "2.0.4",
  "apiBase": "/api/desktop", "features": ["ping"], "writtenAt": "..." }
```

The client re-reads it whenever its modification time changes, so restarting
Luma, a new port or a rotated token need nothing from the mod. Requests go to
`http://127.0.0.1:<port><apiBase>/<feature>/...` with the headers
`X-Luma-Desktop-Token: <token>` and `X-Luma-Client: <mod name>/<version>`. A
feature that is switched off answers `404 { "success": false, "error":
"Feature disabled" }`; a mod can skip it up front with `luma::HasFeature(id)`.

## The canonical client snippet

Windhawk compiles one file per mod, so the client is pasted, not included.
Copy `_shared/luma_client.inc.cpp` **verbatim**, from `// BEGIN luma_client`
through `// END luma_client`, after the mod's header blocks, and add
`-lwinhttp` to `@compilerOptions`. Never edit the copy; change the canonical
file and paste it into every mod again (`npm run windhawk:check` fails a mod
whose copy differs).

```cpp
// in a mod, after the WindhawkModSettings block:
// BEGIN luma_client v1 ...   (pasted)
// END luma_client

BOOL Wh_ModInit() {
    luma::Config config;
    config.clientName = L"windhawk-luma-glance/1.0";
    luma::Configure(config);
    luma::GetAsync(L"/ping/", [](const luma::Response& r) {
        // runs on a thread-pool thread: post to your window before touching UI
        std::string version;
        if (r.ok() && luma::json::GetString(r.body, "version", &version)) Wh_Log(L"Luma %S", version.c_str());
    });
    return TRUE;
}

void Wh_ModUninit() {
    luma::Shutdown();  // cancels requests in flight and waits for their callbacks
}
```

Public API (namespace `luma`):

| Function | Use |
| --- | --- |
| `Configure(Config)` | client name, timeouts (connect 500 ms, total 3000 ms), optional API key, handshake path override |
| `ReadHandshake()` | the cached `Handshake { ok, port, pid, token, apiBase, version, featuresJson }` |
| `HasFeature(id)` | Luma alive and the feature on |
| `Get(path)`, `Post(path, json)` | blocking, worker threads only; `Response { status, body, error, ok() }` |
| `GetAsync(path, cb)`, `PostAsync(path, json, cb)` | thread pool; the DLL stays loaded until the callback returns |
| `AllowForeground()` | call before a request that should bring Luma's window to the front |
| `Shutdown()` | from `Wh_ModUninit` |
| `json::GetString/GetInt/GetBool/GetRaw/ArrayHasString/Quote/ToUtf8/FromUtf8` | read answers, build bodies |

Rules for code that runs inside explorer.exe:

- Never call `Get`/`Post` on a UI thread or inside a hooked function; use the
  async helpers.
- Never throw out of a hook; the client never throws.
- Always call `luma::Shutdown()` in `Wh_ModUninit`.
- Build bodies with `luma::json::Quote` for every string value.

## Writing a new mod

1. Copy `luma-desktop-ping.wh.cpp` to `luma-<name>.wh.cpp`; change `@id` (to
   the file name without `.wh.cpp`), `@name`, `@description`, `@version`, the
   readme and settings blocks; keep `@author LumaBrowser`, `@include` the
   process the mod hooks, and `-lwinhttp`.
2. Keep the `luma_client` block untouched.
3. Run `npm run windhawk:check` (or `npm run windhawk:check -- integrations/windhawk/luma-<name>.wh.cpp`):
   it compiles the mod with the installed Windhawk compiler exactly the way
   Windhawk does, for each `@architecture` (default x86 and x86-64), into a temp
   DLL, and checks the client block. It never installs anything.
4. Add `Documentation/integrations/windhawk/luma-<name>.wh.md`.
