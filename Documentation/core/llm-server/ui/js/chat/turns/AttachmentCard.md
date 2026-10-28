# AttachmentCard

`core/llm-server/ui/js/chat/turns/AttachmentCard.js`

A collapsed timeline card for one parsed attachment: a text file is a
`<details>` that highlights its body on first expand; binary and failed ones are
inert one-liners.

## Methods

- `AttachmentCard.create(attachment)`.
- `AttachmentCard.metaText(attachment)`: `failed: reason`, `size · not embedded`,
  `marked area: note` for a region marker (the share viewer shows those as
  cards; the chat's own turn view draws region chips instead), else the meta.
