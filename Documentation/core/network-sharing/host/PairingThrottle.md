# PairingThrottle

`core/network-sharing/host/PairingThrottle.js`

Wrong-PIN bookkeeping for [PinPairing](PinPairing.md): a per-IP lockout that
doubles per further miss, and a global backoff that refuses every caller once
misses from everyone pass a budget. All state is in memory.

## Methods

- `new PairingThrottle({ now })`: `now` is injectable for tests.
- `lockedFor(ip)`: milliseconds to wait, the larger of the IP's lock and the
  global lock; 0 when a PIN may be tried now.
- `recordFailure(ip)`:
  1. Per IP: the first 4 misses are free; the 5th locks for 30 s and each
     further miss doubles it (60 s, 2 min, 4 min, ...), capped at 1 hour.
     Misses are remembered after a lock expires.
  2. Evicts guards: any whose lock has expired and whose last miss is a day
     old, then the oldest (by last miss) while more than 1000 remain.
  3. Global: misses from all callers in a sliding 10 minute window. The 20th
     trips a lock for every caller of 1 minute, doubling per further trip up
     to 1 hour, and empties the window. A day with no misses at all forgets
     the trip count.
- `recordSuccess(ip)`: forgets that IP's record only; the global window and
  trip count stay, so a caller that gets a PIN right cannot reset them.
- `reset()`: forgets everything (a PIN change).
- Constants: `IP_FREE_FAILS` (5), `IP_LOCK_BASE_MS` (30 s), `IP_LOCK_CAP_MS`
  (1 h), `IP_IDLE_MS` (24 h), `MAX_IP_GUARDS` (1000), `GLOBAL_WINDOW_MS`
  (10 min), `GLOBAL_MISS_BUDGET` (20), `GLOBAL_LOCK_BASE_MS` (1 min),
  `GLOBAL_LOCK_CAP_MS` (1 h), `GLOBAL_QUIET_MS` (24 h).

## Why

The pair route is reachable from the internet when the web backend is
published behind a proxy or tunnel, and then every caller arrives from one
peer address, while an attacker on the open internet can rotate addresses. A
per-IP lockout alone gives either case unlimited guesses, so the global budget
caps the whole host at about 20 guesses per hour (480 a day) once it is under
attack: even odds take about 3 years against a 6 digit PIN, but only about 10
days against an old 4 digit one, which is why new PINs need 6.
A legitimate user who mistypes a few times never reaches the budget. The guard
map is bounded so anonymous callers cannot grow memory without limit.
