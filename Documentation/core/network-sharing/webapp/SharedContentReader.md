# SharedContentReader

`core/network-sharing/webapp/SharedContentReader.js`

Answers the public `/share` routes ([ShareRouter](ShareRouter.md)): resolves a
share token and reads only what that share covers. Every miss is `null`.

## Methods

- `new SharedContentReader(hostService)`; `hostService` provides
  `resolveShare(token)`, `getChatRouter()` and `getChatStore()`.
- `resolve(token)` returns the share, or `null` when the token does not match
  `ShareStore.TOKEN_PATTERN` (checked before any lookup) or is not live.
- `artifactHtml(artifactId, token)` renders an artifact through the chat
  router with `{ webBase: '', dataEndpoint: '/share/<token>/artifact-data',
  dataReadOnly: true }`.
- `conversationData(share)` returns the
  [SharedConversationView](SharedConversationView.md) projection for a
  conversation share. A failing message or artifact list degrades to empty.
- `conversationArtifact(share, id)` returns the artifact only when the share is
  a conversation share and the artifact belongs to that conversation.
- `artifactData(share, rootId)` returns the live-data snapshot when the chain
  belongs to the share (an artifact share's own chain, or any chain inside a
  conversation share) and the snapshot succeeded.
- `SharedContentReader.isUnchangedSince(snapshot, since)` is true when `since`
  parses as an integer and `snapshot.rev <= since`.
- `SharedContentReader.rawArtifact(artifact)` returns `{ bytes, contentType }`
  for image and video artifacts with non-empty base64 content (mime falls back
  to `image/png` / `video/mp4`), else `null`.

## Why

`webBase: ''` makes a rendered document load its live-module libraries
same-origin from `/llm-ui`, which this listener serves; the host's 127.0.0.1
default is unreachable from the device opening the link. Live data is wired
read-only through the share's own route: anonymous viewers may watch the
owner's data but never change it.

Store and router failures are swallowed into "not found" so a public URL never
leaks a 500 that hints something exists.
