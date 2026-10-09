# PairingGate

`core/network-sharing/webapp/public/js/web/PairingGate.js`

The PIN card in front of the chat: shown until a valid token exists, then the
real chat surface mounts over the shim. A 401 anywhere later drops back to it.

## Methods

- `new PairingGate({ api, chatApi, chatMode, doc, win })`.
- `start()`: wires Connect and Enter on the PIN field, listens for
  `luma-unauthorized`, names the host from `api.info()` (default
  `LumaBrowser`), then `tryEnter()`.
- `tryEnter()`: no token shows the card. Otherwise validates with
  `api.listModels()`: Unauthorized clears the token and shows
  `Pairing expired. Enter the PIN again.`; any other failure (network blip)
  mounts anyway.
- `submitPin()`: trims; empty does nothing. Shows `Connecting…` with Connect
  disabled, pairs, clears the field and mounts; a failure shows its message
  (`Could not connect.`).

Mounting adds `chat-mode` to `<body>` (chat.css hides `[data-cm-overlay]`
popovers otherwise: the agent picker, mode menus, voice popovers), then
`chatMode.mount(#chatRoot, chatApi)` and `show()`; once mounted, re-entering
only calls `show()`. A missing chat shows `Chat UI failed to load. Refresh the page.`
`luma-unauthorized` clears the token and shows `Pairing ended. Enter the PIN again.`
