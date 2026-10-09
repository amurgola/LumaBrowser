# TabStore

`ui/shell/tabs/TabStore.js`

The renderer's mirror of main's tabs (main is the source of truth) and the active tab id. Extension renderers read the same Map through BrowserRenderer.

## Methods

- `tabs` (Map), `activeTabId`.
- `TabStore.entryFrom(state)`.
- `get`, `has`, `set`, `delete`, `values`, `entries`, `active()`, `keepAliveCount()`.

## Globals

None.
