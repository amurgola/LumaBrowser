# BuilderMeta

`extensions/site-apis/builder/BuilderMeta.js`

The builder conversation's meta data over the chat store (`getMeta` / `setMeta`, mode kept at
`site-api-builder`).

## Shape

`{ partition, origin, startUrl, sourceTabId?, siteId?, workTabId?, endpointId?, recording?: { endpointId, name, messageId, at }, returnsDeclared? }`.
The opener writes `{ partition, origin, startUrl, sourceTabId }` or `{ siteId }`; the mode adds `siteId` and
`workTabId`; the tools add `endpointId`, `recording` and `returnsDeclared`.

## Methods

- `read(chatStore, conversationId)`: the data object (`{}` without a store).
- `dataOf(meta)`: the data of a meta row.
- `patch(chatStore, conversationId, patch)`: merges and persists (`undefined` ignored, `null` deletes the key);
  answers the merged data; persists nothing without a store.
- `merge(current, patch)`, `isBound(data)`, `originOf(url)` (http(s) origin or null).
