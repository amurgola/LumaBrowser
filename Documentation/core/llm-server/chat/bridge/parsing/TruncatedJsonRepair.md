# TruncatedJsonRepair

`core/llm-server/chat/bridge/parsing/TruncatedJsonRepair.js`

Best-effort repair of a JSON snippet the model cut off.

## Methods (all static)

- `repair(text)`: strips a trailing comma/whitespace, then (counting
  string-aware) closes a dangling string and appends missing `]` then `}`.
  Balanced text comes back unchanged apart from that trim.

Every caller must mark a repaired call `__repaired` (a test scans `bridge/`).
