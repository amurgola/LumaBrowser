# PairingGate

`core/network-sharing/webapp/public/js/web/PairingGate.js`

The sign-in card in front of the chat: shown until a valid token exists, then
the real chat surface mounts over the shim. The field takes the host PIN or a
user's access key (the host tells them apart). A 401 anywhere later drops back
to it.

## Methods

- `new PairingGate({ api, chatApi, chatMode, doc, win })`.
- `start()`: wires Connect and Enter on the PIN field, listens for
  `luma-unauthorized`, names the host from `api.info()` (default
  `LumaBrowser`). A login link (`?apiKey=<key>`) signs in with that key at once,
  after the key is taken out of the address bar with `history.replaceState`
  (other query parameters and the hash stay); otherwise `tryEnter()`.
- `tryEnter()`: no token shows the card. Otherwise validates with
  `api.listModels()`: Unauthorized clears the token and shows
  `Pairing expired. Enter the PIN or your access key again.`; any other failure (network blip)
  mounts anyway.
- `submitPin()`: trims; empty does nothing. Shows `Connecting…` with Connect
  disabled, pairs (a key goes the same way as a PIN), clears the field and
  mounts; a failure shows its message (`Could not connect.`).

Mounting adds `chat-mode` to `<body>` (chat.css hides `[data-cm-overlay]`
popovers otherwise: the agent picker, mode menus, voice popovers), then
`chatMode.mount(#chatRoot, chatApi)` and `show()`; once mounted, re-entering
only calls `show()`. A missing chat shows `Chat UI failed to load. Refresh the page.`
`luma-unauthorized` clears the token and shows `Pairing ended. Enter the PIN or your access key again.`
