# TabShareSettings

`extensions/tab-share/TabShareSettings.js`

Tab Share's streaming settings, persisted under the extension's `settings`
key: `{ rtcEnabled, turnEnabled, turnPort, turnHost }`.

## Methods

- `new TabShareSettings({ db, log })`; `get()` a copy; `load()` (stored
  values of the wrong type or an out-of-range port fall back to `DEFAULTS`).
- `update(patch)`: booleans for the two toggles, `turnPort` must be an
  integer 1 to 65535 (else `{ error: 'Relay port must be between 1 and
  65535.' }`, nothing changed), `turnHost` reduced to a bare host. Persists
  and returns `{ relayChanged }` (toggle or port changed).
- `TabShareSettings.normalizeHost(value)`:
  `https://relay.example.net:9/x` -> `relay.example.net`.
- `DEFAULTS`: optimized stream on (it degrades to frames by itself), relay
  off on port 3478, no host.
