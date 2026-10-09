# HookBaseUrls

`app/sharing/HookBaseUrls.js`

The base URLs a webhook sender can reach the `/hooks` trigger router on, for the
trigger mode's prompt and the LLM IPC handlers.

## Methods

- `new HookBaseUrls({ getPort, getHostService, getWebServer })`; the sharing
  getters may return null (sharing is built after triggers).
- `get()` returns `{ local, lan?, public? }`: `local` is always
  `http://127.0.0.1:<gateway port>`; `lan` is `http://<lan ip>:<port>` when the
  host knows a LAN address other than 127.0.0.1; `public` is the sharing share
  base URL while the web backend is running. Never throws.
- `getter()` the `getHookBaseUrls` function to hand out.
