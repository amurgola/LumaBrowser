# IndexedDbRepository

`core/network-sharing/webapp/public/js/store/IndexedDbRepository.js`

Plain IndexedDB access: opens the database once (creating missing object stores
and their indexes on upgrade) and runs one transaction with promise-returning
operations. No query logic.

## Methods

- `new IndexedDbRepository({ indexedDB, name, version, stores })`; `stores` is
  `{ name: { keyPath, indexes: [indexName] } }` (each index's key path is its name).
- `run(storeNames, mode, fn)`: `fn(ops)` runs inside one transaction and the
  promise resolves with its result on `complete` (rejects on `error`/`abort`).
  `ops`: `get(store, key)`, `getAll(store)`, `put(store, record)`,
  `delete(store, key)`, `getAllByIndex(store, index, key)`,
  `getAllKeysByIndex(store, index, key)`.
