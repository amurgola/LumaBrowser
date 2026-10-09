# CallSignature

`core/llm-server/chat/tool-loop/CallSignature.js`

The identity of one tool call for loop detection.

## Methods

- `CallSignature.of(name, params)`: flattens `params` into sorted
  `path=value` facts (`a.b=1`, `list[0]=x`). Strings are trimmed with
  whitespace runs collapsed, numeric strings read as numbers, and `null`,
  blank strings and empty containers are dropped. Cycles become `<cycle>`.
- `key`: `name(fact; fact; ...)`; `facts`, `name`.
- `matches(other)`: same key.

## Why

Two calls are the same attempt when they mean the same thing. Models flip
between `"7"` and `7`, add stray spaces, or send `find: ""` one time and leave
it out the next. Case and array order are kept, because they can change what
a call does.
