# GameDataStore

`extensions/game-mode/store/GameDataStore.js`

The persistent data of one AI game: named collections of JSON values in `<gameDir>/.gamedata/store.json`, flushed atomically (tmp + rename) with a monotonic `rev`. The dot-directory keeps it out of the play server and the agent's searches; it is deleted with the conversation.

## Methods

- `new GameDataStore(gameDir)`; `rev`; `all()`, `list(col)`, `get(col, key)` return deep copies.
- `mutate(col, { set, remove })`, `set(col, key, value)`, `remove(col, key)`, `clear(col)`, `reset()` -> `{ success: true, rev }` or `{ success: false, error }`; a failed write rolls the in-memory copy back.
- `isValidName(name)` `[A-Za-z0-9_.:-]{1,64}`.
- Quotas: 64 KB per value, 4 MB per document, 2000 keys per collection, 64 collections.
