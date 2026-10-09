# CodeHash

`extensions/tool-forge/CodeHash.js`

The SHA-256 (hex) of a tool's code. A passing test is stamped with it, so any
edit invalidates the publish gate.

## Methods

- `CodeHash.of(code)`: hex digest of `String(code || '')` (UTF-8).
