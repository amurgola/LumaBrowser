# WindowCounter

`core/llm-server/chat/triggers/webhook/WindowCounter.js`

Sliding-window hit counters keyed by a string, behind the webhook receiver's
per-token rate limit and per-IP lockout.

## Methods

- `new WindowCounter(windowMs)`.
- `hit(key, now = Date.now())` records a hit and returns the key's hits inside
  the window, this one included.
- `count(key, now = Date.now())` returns the key's hits inside the window.
- `WindowCounter.MAX_KEYS` (5000): past it the oldest key is evicted.

## Why

The counters live in memory for the life of the router. The key bound keeps a
flood of distinct IPs or tokens from growing the map without limit; evicting the
oldest key is crude but enough for a lockout whose only job is to slow probing.
