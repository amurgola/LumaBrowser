# luma_client

`integrations/windhawk/_shared/luma_client.inc.cpp`

The canonical C++ client every LumaBrowser Windhawk mod embeds verbatim
between `// BEGIN luma_client` and `// END luma_client` (Windhawk mods are
single files). `npm run windhawk:check` fails a mod whose copy differs. The
contract it implements is in
[Desktop Integration](../../../extensions/desktop-integration/README.md); usage
is in `integrations/windhawk/README.md`.

## API (namespace `luma`)

- `struct Config { std::wstring clientName; DWORD connectTimeoutMs = 500; DWORD totalTimeoutMs = 3000; std::wstring apiKey; std::wstring handshakePath; }`
- `struct Handshake { bool ok; int port; DWORD pid; std::string token, apiBase, version, featuresJson; }`
- `struct Response { int status; std::string body; DWORD error; bool ok() const; }` (`status` 0: no response)
- `using Callback = std::function<void(const Response&)>`
- `void Configure(const Config&)`: once from `Wh_ModInit` (again on settings change).
- `Handshake ReadHandshake()`: cached, re-read when `desktop.json`'s modification time changes.
- `bool HasFeature(std::string_view id)`: Luma alive and the feature in the handshake.
- `Response Get(std::wstring_view path)`, `Response Post(std::wstring_view path, std::string_view jsonBody)`:
  blocking; `path` is relative to `apiBase` (`L"/ping/"`). Worker threads only.
- `bool GetAsync(path, Callback)`, `bool PostAsync(path, jsonBody, Callback)`:
  on the Windows thread pool; the callback runs on a pool thread, the mod DLL
  is pinned until it returns.
- `bool AllowForeground()`: `AllowSetForegroundWindow(<Luma pid>)` before a request that raises Luma.
- `void Shutdown(DWORD waitMs = 4000)`: from `Wh_ModUninit`; refuses new
  requests, closes the ones in flight, waits for callbacks, closes the session.
- `luma::json`: `GetString`, `GetInt`, `GetBool`, `GetRaw` (top-level keys of an
  object; `GetRaw` returns a nested object or array to search further),
  `ArrayHasString`, `Quote` (a JSON string literal for bodies), `ToUtf8`, `FromUtf8`.

## Behavior

- Handshake: `Config.handshakePath`, else `%LUMA_DESKTOP_HANDSHAKE%`, else
  `%USERPROFILE%\.lumabrowser\desktop.json`; at most 64 KB.
- A dead Luma pid answers at once (`status` 0, `ERROR_NOT_READY`) instead of
  waiting on a connect.
- Headers: `X-Luma-Desktop-Token`, `X-Luma-Client` (default
  `windhawk-<WH_MOD_ID>/<WH_MOD_VERSION>`), `Content-Type` and `Accept` JSON,
  `X-API-Key` when configured. No proxy. Responses are capped at 4 MB.
- Every public function catches everything; nothing throws to the caller.
