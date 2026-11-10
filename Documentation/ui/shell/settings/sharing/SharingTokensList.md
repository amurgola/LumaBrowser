# SharingTokensList

`ui/shell/settings/sharing/SharingTokensList.js`

Paired web clients with usage, last use, Revoke / Remove and Revoke all. The list sits in the `share-clients` fold group ([FoldGroups](../general/FoldGroups.md)); its summary line counts the clients.

## Methods

- `install()`, `render(tokens)`.
- `compact(n)`, `usageLine(u)`, `rowHtml(t)`, `countText(tokens)` (static).

## Globals

Reads `window.sharingAPI` (injected).
