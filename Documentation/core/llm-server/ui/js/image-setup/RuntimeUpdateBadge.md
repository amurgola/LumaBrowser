# RuntimeUpdateBadge

`core/llm-server/ui/js/image-setup/RuntimeUpdateBadge.js`

`RuntimeUpdateBadge.apply(body, id, info)` applies a cached upstream-update result to one installed image runtime row. A newer release puts the Update button (versions in its title) in the row's state slot and a neutral "Update available" badge in the head; a current build reads a muted "Up to date". Rows without the slot (not installed, or mid-install) are left alone. Mirrors the LLM tab's [RuntimeUpdateBadge](../setup-ui/runtimes/RuntimeUpdateBadge.md).

## Globals

None.
