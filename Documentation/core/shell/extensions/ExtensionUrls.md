# ExtensionUrls

`core/shell/extensions/ExtensionUrls.js`

The served URL of an extension's UI files.

## Methods

- `ExtensionUrls.uiAsset(extensionId, relPath)` returns
  `/llm-ui/ext/<extensionId>/<basename of relPath>` (the route main.js serves).
- `ExtensionUrls.uiFile(extensionId, relPath)` keeps the relative sub-path
  (`./ui/widgets/X.js` -> `/llm-ui/ext/<id>/ui/widgets/X.js`; backslashes
  normalised, a leading `./` dropped) so a Dashboard widget module's relative
  imports resolve to its declared siblings; `null` for an empty path or one
  with a `..` segment.
- `ExtensionUrls.UI_PREFIX` is `/llm-ui/ext`.
