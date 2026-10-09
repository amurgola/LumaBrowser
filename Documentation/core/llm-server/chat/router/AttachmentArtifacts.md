# AttachmentArtifacts

`core/llm-server/chat/router/AttachmentArtifacts.js`

Promotes a turn's attached images to persisted artifacts linked to the user message.

## Methods

- `new AttachmentArtifacts({ chatStore, getAgentDeps })`.
- `persist(images, convId, userRow)`: for each image `artifactStore.create({ conversationId, messageId, title: name || 'Image', type: 'image', mime || 'image/png', content: base64 })`, collected as `{ id, title, type: 'image', language }` and recorded on the user row's `toolCalls.artifacts`. `[]` without images, a user row or an artifact store; a failed create is logged and skipped.

## Why

An attachment then shows in the Artifacts list, survives a reload as a thumbnail and can be named by edit_image later.
