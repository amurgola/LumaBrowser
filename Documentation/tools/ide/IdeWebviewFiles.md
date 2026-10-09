# IdeWebviewFiles

`tools/ide/IdeWebviewFiles.js`

What the two IDE hosts share, in one list, and the one call both builds use to write the page: `index.html` and
`luma.css` copied from `ide/webview`, the CLI's tool grammar under `shared/`, and `app.js` bundled from
`ide/webview/ui/entry.js`. Thin entry: `scripts/lib/ide-webview-files.js` exports this class.

## Methods

- `IdeWebviewFiles.syncPage(root, destDir, by)`: writes the page; returns the file count (4).
- `IdeWebviewFiles.copyPairs()`, `IdeWebviewFiles.syncFiles(root, destDir, pairs, by)`.
- Constants: `PAGE_DIR`, `PAGE_FILES`, `APP_FILE`, `SHARED_FILES`.
