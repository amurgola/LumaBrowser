# TransientLlmError

`core/llm-server/chat/router/TransientLlmError.js`

Tells a connection-class model failure worth retrying from a real model or auth error.

## Methods

All static.

- `matches(err)`: an Error or string whose lowercased message contains one of `MARKERS` (`econnreset`, `econnrefused`, `etimedout`, `epipe`, `socket hang up`, `network`, `fetch failed`, `terminated`, `aborted`) or a 502/503/504 code (`GATEWAY_CODES`).

## Why

Bug M15: the agent loop's and complete()'s lists had drifted, and the side-completion path, which runs right after a streaming turn on a keep-alive socket the local server already closed, missed undici's `terminated` and the gateway codes. Every retrying path shares this one rule.
