# ToolJson

`core/llm-server/chat/bridge/parsing/ToolJson.js`

Reads one candidate tool-call JSON text into `{ tool, params }`.

## Methods (all static)

- `read(text)`: strict parse (retried with
  `BrowserTools.fixIllegalJsonEscapes`, no marker), accepting
  `fromObject` shapes or flattened arguments on a `"tool"` key; else
  [TruncatedJsonRepair](TruncatedJsonRepair.md) (marked `__repaired: true`);
  else the unkeyed-name shape `{"grep", ...}`. Valid JSON that is not a call
  is null.
- `fromObject(o)`: `{ tool|name, params|arguments }` with an args object, the
  doubled wrapper `{"tool": {...call}}`, and the `__argsLost`, `__argsCut`,
  `__repaired` markers carried through. Null for `{"name": "John"}`.
- `restAsParams(o)`: every key except `tool`, `name`, `params`, `arguments`.
- `NAME_KEYS`, `RESERVED_KEYS`.
