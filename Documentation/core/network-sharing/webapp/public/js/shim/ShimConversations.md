# ShimConversations

`core/network-sharing/webapp/public/js/shim/ShimConversations.js`

The shim's `conv` surface over the device store, in the desktop's reply shapes.

## Methods

- `new ShimConversations(store)`; `surface()` returns the `conv` object:
  `list`, `get`, `create` (`{ success, <key> }`); `rename`, `delete`, `pin`,
  `archive`, `deleteMessage`, `clearMessages`, `setTools`, `setReasoningEffort`
  (`{ success: true }`); `messages`, `addMessage` (`msg.conversationId`);
  `updateMessage`, `search`, `autotitle`, `artifacts`; `setVariant` and
  `variants` (no variants on the web); `meta.get`, `meta.set`.
- `updateMessage(messageId, { content, conversationId })`: `{ success }`, or
  `{ success: false, error: 'content required' }` without both fields.
- `search(q)`: case-insensitive title match over the listed conversations.
- `autotitle(id)`: the first user line as title (`{ success, title }`), or
  `{ success: true }` when there is none (the chat only refreshes on `title`).
- `artifacts(id)`: each with `url` = [ArtifactViewUrl](ArtifactViewUrl.md).
- `getMeta(id)`: stored meta, else `{ mode: <conversation mode or 'chat'>, data: {} }`.
- `setMeta(id, patch)`: shallow merge into stored meta.
