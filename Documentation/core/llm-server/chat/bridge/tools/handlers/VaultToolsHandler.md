# VaultToolsHandler

`core/llm-server/chat/bridge/tools/handlers/VaultToolsHandler.js`

The in-app chat's `vault_list` and `vault_fill`, a built-in chat handler, so it is never offered to MCP clients or the
REST API. Uses `ctx.deps.vaultService.agent` ([VaultAgentAccess](../../../../../vault/VaultAgentAccess.md)).

- `vault_list { tabId? }` lists allowed items (logins narrowed to the tab's site when a tab is given).
- `vault_fill { ref, tabId? }` fills into the given tab, or the user's active tab.
- Outside callers: a run nobody can answer (`allowTakeover` false, such as a Network Sharing client) or one with an
  approval override (the terminal, triggers). They are refused unless the user allowed outside callers.

`vault_fill` is in ApprovalGate's password-manager family (`family:vault`, carried for the chat, `insist`): it asks
before every fill unless the user allowed it for this chat, even when the approval setting says never ask.

## Methods

- `names()`, `execute(name, params, ctx)`, `VaultToolsHandler.callerOf(ctx)`.

## Keys and two-factor

`vault_list` without `tabId` lists every allowed item, and with it narrows logins to that tab's site. `vault_fill { part: 'otp' }` fills the login's two-factor code. Keys are used by placeholder through the tool pipeline, not by this handler.
