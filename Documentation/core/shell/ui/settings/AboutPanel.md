# AboutPanel

`core/shell/ui/settings/AboutPanel.js` (ES module)

Settings > About > About: product name, version, app and third-party licenses, then the update controls. Loads once.

## Methods

- `new AboutPanel(hooks)`, `load()` (`window.electronAPI.getLicenses()`;
  retried after a failure).
- `AboutPanel.productName(name)`: the package name only when it is not the npm
  slug and mentions Luma, else "LumaBrowser".

## Globals

Reads `window.electronAPI.getLicenses`.
