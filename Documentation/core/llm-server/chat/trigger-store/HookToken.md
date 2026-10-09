# HookToken

`core/llm-server/chat/trigger-store/HookToken.js`

A webhook trigger's hook token, the whole credential of its URL.

## Methods

- `HookToken.create()`: 24 random bytes as 32 base64url characters.
- `HookToken.isWellFormed(token)`: matches `PATTERN` (`/^[A-Za-z0-9_-]{32}$/`).

## Why

Lookups shape-check first so junk never reaches the index.
