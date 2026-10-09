# LumaStore

`core/network-sharing/webapp/public/js/store/LumaStore.js`

On-device persistence for the web chat client: conversations with embedded
messages, and cached artifacts, in IndexedDB (`luma-web-chat`, version 2; image
artifacts outgrow localStorage). The host keeps no conversations for a web client.

## Methods

- `LumaStore.open(indexedDB)`: over an [IndexedDbRepository](IndexedDbRepository.md)
  with `LumaStore.SCHEMA` (`conversations` keyed by `id` with an `updatedAt`
  index, `artifacts` keyed by `id` with a `conversationId` index).
- `new LumaStore(repo)`: any object with the repository's `run(storeNames, mode, fn)`
  (tests use an in-memory one).
- Fields: `conversations` ([ConversationStore](ConversationStore.md)),
  `messages` ([MessageStore](MessageStore.md)), `artifacts` ([ArtifactStore](ArtifactStore.md)).
