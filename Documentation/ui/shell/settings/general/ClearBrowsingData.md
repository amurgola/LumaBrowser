# ClearBrowsingData

`ui/shell/settings/general/ClearBrowsingData.js`

Settings > Privacy & permissions > Browsing data > Clear browsing data (`#gsClearData`, a `<details>` row that opens its options in place): a time range and checkboxes for browsing history,
cookies and site data, cached images and files, and the downloads list; Clear sends them to `core.browsingData.clear`
and toasts what was cleared. It replaces the separate "Clear history" and "Clear cache" rows. The gear menu's "Clear
browsing data" and Ctrl+Shift+Delete open the `ClearBrowsingData.TAB` tab, open the options and scroll here (`ClearBrowsingData.reveal()`).

## Methods

- `new ClearBrowsingData({ feedback, historyModal })`, `install()`, `selection()`, `clear()`.
- Statics: `summary(cleared)`, `reveal()`, `ANCHOR`, `TAB`.
