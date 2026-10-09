# ManifestHtmlFiles

`core/shell/extensions/ManifestHtmlFiles.js`

Inlines the HTML files a manifest's declarative UI points at.

## Methods

- `ManifestHtmlFiles.resolve(manifest)` sets `_resolvedHtml` on
  `navigationBar.panel` and `settings` when they have `htmlFile` and no inline
  `html`. A missing file becomes `<div class="ext-error">Missing: <htmlFile></div>`
  (and a warning). Mutates the manifest.
