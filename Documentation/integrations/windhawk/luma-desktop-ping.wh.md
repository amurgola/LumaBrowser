# luma-desktop-ping

`integrations/windhawk/luma-desktop-ping.wh.cpp`

A minimal Windhawk mod (id `luma-desktop-ping`, `@include explorer.exe`,
`@compilerOptions -lwinhttp`) and the template for every LumaBrowser mod: it
embeds [luma_client](_shared/luma_client.inc.md) verbatim, and on init (and on
a settings change) logs the handshake and the answer of
`GET /api/desktop/ping/` to the Windhawk log, from the thread pool. Settings:
`apiKey` (only when Luma requires an API key) and `timeoutMs`.
`Wh_ModUninit` calls `luma::Shutdown()`. It changes nothing in Explorer.
