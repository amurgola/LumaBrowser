# PinPairing

`core/network-sharing/host/PinPairing.js`

Exchanges the host PIN for a paired-client bearer token, with a per-IP lockout
that grows after repeated wrong PINs.

## Methods

- `new PinPairing({ settings, tokens, getInstanceName, notify, now })`:
  `settings` is [HostSettings](HostSettings.md), `tokens` a
  [TokenStore](../TokenStore.md); `now` is injectable for tests.
- `pair(pin, { ip, peerHint })`:
  1. While the IP (or `'unknown'`) is locked: `{ success: false, error: 'Too
     many attempts. Try again later.', retryAfterMs }`.
  2. No stored PIN: `Host has no PIN set.`
  3. Wrong PIN: `Incorrect PIN.`; from the 5th failure the IP is locked for
     `30 s x (failures - 4)`. Failures are remembered after a lock expires.
  4. Right PIN: clears the IP's record, issues a token labelled `peerHint` (or
     `Peer <ip>`), calls `notify({ ip, peerHint, label, tokenId })`
     (errors swallowed) and returns `{ success: true, token, name }`.
- `reset()`: forgets every lockout (called when the PIN changes).
- `PinPairing.pinMatches(given, stored)`: `crypto.timingSafeEqual`; a length
  mismatch still burns one comparison before failing.
- `PinPairing.toReply(result)`: `{ status: 200, body: { token, name } }`, or
  429 (locked) / 401 with `{ error, retryAfterMs }`.
- `MAX_FAILS` (5), `LOCK_BASE_MS` (30000).

## Why

A 4-digit PIN has only 10k combinations, so the lockout is what makes PIN
pairing safe on a LAN. Each successful pair is a new device with its own
token, the natural moment to tell the host user.
