# ProviderCardShell

`ui/shell/settings/providers/ProviderCardShell.js`

The frame every provider card shares: a `<details class="provider-card">` that reads as one compact row (chevron, name, a muted line on what it is using such as its model, a state word) and opens in place to the card's own fields. [ManagedProviderCard](ManagedProviderCard.md), [PeerProviderCard](PeerProviderCard.md) and [EditableProviderCard](EditableProviderCard.md) each supply the parts; [ProviderList](ProviderList.md) decides which cards start open.

## Methods

- `ProviderCardShell.html({ name, meta, status, ok, bodyHtml })`: `name`, `meta` and `status` are escaped; `bodyHtml` is trusted markup; `ok: false` draws the state word as a warning.
- `ProviderCardShell.build(parts)` returns the `<details>` element.
- `CHEVRON`: the shared chevron markup.

## Globals

None.
