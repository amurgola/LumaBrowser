# HostThinking

`core/network-sharing/webapp/public/js/shim/HostThinking.js`

The host's thinking capability (`/sharing/resources` `.thinking`), fetched once
per session.

## Methods

- `new HostThinking(api)`.
- `capability()`: cached; `null` when the host has none or the call fails.
- `defaults()`: `{ reasoningEffort: hostDefault or 'default', noThink: false }`,
  or `{}` (routes mode preflight straight to the models check).
- `serverStatus()`: `{ state: 'ready'|'idle', caps: { reasoningEffort, reasoningDial } | null, plan: null }`.
