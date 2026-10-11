# RuntimeRowHtml

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeRowHtml.js`

One collapsible runtime row: status badges, the primary Install/Update button that stays visible collapsed, and the details panel with version, path, provenance and the secondary actions.

## Methods

- `html(r)`; `statusLabel(r)`; `badges(r)` (a GPU build whose backend check found no device gets one `backend failed to load` badge with the cause, in place of the hardware badge); `backendFailed(r)`; the details panel adds a Devices row (the backend's listed devices) or a Backend row (the failure); `secondaryActions(r)` (Uninstall for managed, Clear registration for manual, Relocate when installed, Download pre-release for GitHub-release runtimes with an asset, then Build instructions or See releases).

## Globals

None.
