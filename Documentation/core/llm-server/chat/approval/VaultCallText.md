# VaultCallText

`core/llm-server/chat/approval/VaultCallText.js`

Approval card text for `vault_fill`: "Use your GitHub login on github.com? The assistant fills it and never sees the
password." or "Fill your "Home" address into shop.example?". The model's params only name an item reference and a tab,
so the text comes from a resolver the vault installs at boot (`VaultService.describeCall`). Without one, the card
still asks with a generic line. Never holds a secret.

## Methods

- `VaultCallText.setResolver(fn | null)`, `VaultCallText.fill(params)`, `VaultCallText.DESCRIBERS` (spread into
  CallDescriber).
