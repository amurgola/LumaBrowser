# ConversationStore

`core/network-sharing/webapp/public/js/store/ConversationStore.js`

The web chat's conversation records.

## Methods

- `new ConversationStore(repo)`.
- `list()`: archived ones hidden; pinned first, then newest `updatedAt` first.
- `get(id)`: the record or `undefined`.
- `create({ mode? })`: a [blank conversation](StoreRecords.md), stored and returned.
- `patch(id, patch)`: merges, bumps `updatedAt` unless the patch sets it;
  resolves the record or `null` for an unknown id.
- `delete(id)`: the record and every artifact with that `conversationId`, in one transaction.
