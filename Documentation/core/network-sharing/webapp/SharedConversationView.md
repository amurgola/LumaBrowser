# SharedConversationView

`core/network-sharing/webapp/SharedConversationView.js`

The read-only JSON a public share link exposes for a conversation.

## Methods

- `SharedConversationView.build(conversation, messages, artifacts)` returns
  `{ success: true, conversation: { title, createdAt, updatedAt }, messages:
  [{ id, role, content, error, createdAt, artifacts }], artifacts: [{ id,
  title, type, language }] }`. Title defaults to `Conversation`; missing
  values become `''` (content) or `null`.
- `SharedConversationView.artifactRefs(list)` turns a message's
  `toolCalls.artifacts` into `{ id, title, type }` refs: deduplicated by id,
  id-less entries dropped, title defaults to `Artifact`, type to `html`.

## Why

A share token is public, so the projection is a whitelist. Tool-call
parameters, token counts, model refs and variant plumbing stay on the host.
`reasoning` is dropped unconditionally: the model's chain of thought is not the
answer the link was minted to show (the chat's own think pane is unaffected).
