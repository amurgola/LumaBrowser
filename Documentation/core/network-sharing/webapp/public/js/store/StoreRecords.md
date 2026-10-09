# StoreRecords

`core/network-sharing/webapp/public/js/store/StoreRecords.js`

The web chat store's object store names (`conversations`, `artifacts`), ids,
timestamps, the blank conversation and the title rule.

## Methods

- `StoreRecords.newId(prefix)`: `<prefix>_<time36>_<random6>`.
- `StoreRecords.now()`: ISO timestamp.
- `StoreRecords.blankConversation({ id?, mode? })`: `{ id, title: 'New chat',
  createdAt, updatedAt, pinned: false, archived: false, mode: mode or 'chat',
  modelRef: null, provider: null, toolsEnabled: false, meta: null, messages: [] }`.
- `StoreRecords.titleFrom(text)`: whitespace collapsed, trimmed, at most 60 characters
  (also the shim's `autotitle`).
