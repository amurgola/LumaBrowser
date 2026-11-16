# PinPairing

`core/network-sharing/host/PinPairing.js`

Exchanges the host PIN for a paired-client bearer token, refusing callers that
[PairingThrottle](PairingThrottle.md) has locked out.

## Methods

- `new PinPairing({ settings, tokens, getInstanceName, notify, now })`:
  `settings` is [HostSettings](HostSettings.md), `tokens` a
  [TokenStore](../TokenStore.md); `now` is injectable for tests and is handed
  to the throttle.
- `pair(pin, { ip, peerHint })`:
  1. While the IP (or `'unknown'`) is locked, or every caller is (the global
     backoff): `{ success: false, error: 'Too many attempts. Try again
     later.', retryAfterMs }`. This refuses the right PIN too.
  2. No stored PIN: `Host has no PIN set.`
  3. Wrong PIN: `Incorrect PIN.`, recorded with the throttle (per IP and
     global).
  4. Right PIN: forgives the IP's own record (not the global count), issues a
     token labelled `peerHint` (or `Peer <ip>`), calls `notify({ ip, peerHint,
     label, tokenId })` (errors swallowed) and returns `{ success: true,
     token, name }`.
- `reset()`: forgets every lockout, per IP and global (called when the PIN
  changes).
- `PinPairing.pinMatches(given, stored)`: `crypto.timingSafeEqual`; a length
  mismatch still burns one comparison before failing.
- `PinPairing.toReply(result)`: `{ status: 200, body: { token, name } }`, or
  429 (locked) / 401 with `{ error, retryAfterMs }`.

## Why

New PINs are 6 to 8 digits, but a 4 or 5 digit PIN stored before the floor
rose still pairs, so no existing host is locked out. The throttle is what
keeps guessing slow either way. Each successful pair is a new device with its
own token, the natural moment to tell the host user.
