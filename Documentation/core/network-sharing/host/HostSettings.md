# HostSettings

`core/network-sharing/host/HostSettings.js`

The sharing host's persisted settings over the SettingsDatabase. Reads fall
back to safe defaults; setters validate.

## Methods

- `new HostSettings(db)`.
- `readEnabled()`, `writeEnabled(enabled)`.
- `instanceId()`: the stored id, minting and storing a UUID the first time.
- `getPin()`, `hasPin()`, `setPin(pin)` (false unless 4 to 8 digits after
  trimming), `clearPin()`.
- `getInstanceName()` (stored name, else `os.hostname()`, else `LumaBrowser`),
  `setInstanceName(name)` (capped at 63 characters, trimmed; empty clears).
- `getBindMode()` / `setBindMode(mode)`: `'any'` or `'lan'` (anything else).
- `getShareFlags()`: `{ shareLocalLlm, shareRemoteLlms, shareImageGen,
  shareImageEdit, shareGpus, shareAgents, shareVoice }`; all default true
  except `shareGpus`; a stored null or undefined reads as the default.
  `setShareFlag(flag, value)` returns false for an unknown (or inherited) name.
- `getTlsPort()` / `setTlsPort(port)` (default 3443), `getWebPort()` /
  `setWebPort(port)` (default 80): an invalid stored port reads as the default.
- `isWebEnabled()` / `setWebEnabled(enabled)` (default false).
- `getWebPublicUrl()` (non-strings read as `''`), `setWebPublicUrl(url)`:
  trims, drops trailing slashes, empty clears; anything not starting with
  `http(s)://host` fails with the legacy message.
- `getWebAllowedTools()` / `setWebAllowedTools(tools|null)` (raw; validation is in [WebToolAllowList](WebToolAllowList.md)).
- `HostSettings.validPort(value)`: the integer 1 to 65535, else null.
- Statics: every key (`ENABLED_KEY` ... `WEB_PUBLIC_URL_KEY`),
  `SHARE_FLAGS` (`{ key, fallback }` per flag), `DEFAULT_WEB_PORT`, `DEFAULT_TLS_PORT`.

## Why

GPU lending defaults off because the llama.cpp RPC protocol is
unauthenticated. Agents default on but can be withheld, since they carry a
persona, tool grants and a private knowledge base.
