# RuntimeRowHtml

`core/llm-server/ui/js/setup-ui/runtimes/RuntimeRowHtml.js`

One collapsible runtime row: status badges, the Install/Update button (a compact secondary `.luma-btn`, since every row has one) that stays visible collapsed, and the details panel with version, path, provenance and the secondary actions.

## Methods

- `RuntimeRowHtml.html(row, advice = null)`: `advice` is this host's [HostRuntimeAdvice](HostRuntimeAdvice.md) entry; `adviceBadge` adds the gem badge ("recommended for this PC") or a muted "not for this PC", and `adviceLine` the one-line reason under the head, visible on a collapsed row.

- `html(r)`; `statusLabel(r)`; `badges(r)` (a GPU build whose backend check found no device gets one `backend failed to load` badge with the cause, in place of the hardware badge); `backendFailed(r)`; the details panel adds a Devices row (the backend's listed devices) or a Backend row (the failure); `secondaryActions(r)` (Uninstall for managed, Clear registration for manual, Relocate when installed, Download pre-release for GitHub-release runtimes with an asset, then Build instructions or See releases).

## Globals

None.
