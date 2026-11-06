# VaultAgentAccess

`core/vault/VaultAgentAccess.js`

What the assistant may do with the vault: use an item, never read it. Reached as `VaultService.agent`. A use is
refused unless:

- the item's `aiAccess` is on;
- the vault is unlocked;
- a login's site matches the tab's live URL;
- for an outside caller (REST, MCP, terminal, a shared or unattended run), `core.vault.allowExternal` is on.

Every fill, done or refused, goes to the audit ([VaultAudit](VaultAudit.md)).

## Methods

- `list({ tabUrl, caller })` -> `{ success, items }`. Logins are `{ ref, kind: 'login', name, site, username }`, with
  the username masked (`o***t@example.com`) and filtered to `tabUrl`'s site when given. Profiles are
  `{ ref, kind: 'profile', name, fields }`, where `fields` names the filled keys and holds no values. Never a secret.
- `fill({ tabId, ref, caller })` -> `{ success, filled: 'login' | 'address', name, site }` or `{ success: false, error }`
  (`locked: true` when locked). Main types the value; the result never holds it.
- `describe(ref)` -> `{ kind, name, site }` for an approval card.
- `allowExternal()`, `setAllowExternal(on)`, `VaultAgentAccess.mask(username)`.

## Keys and two-factor

- `list` adds keys as `{ ref, kind: 'key', name, placeholder, usableIn }` and marks logins with a two-factor secret `hasTwoFactor`.
- `resolveKeys(toolName, params, caller)` swaps `{{vault:name}}` placeholders ([VaultPlaceholders](VaultPlaceholders.md)) for allowed keys, only in `KEY_TOOLS` (`send_webhook`, `send_notification_ntfy`, `run_command`), and audits each key used (`action: 'key'`, `site`: the tool).
- `fill({ ..., part: 'otp' })` fills the login's current code; a key is never filled into a page.
