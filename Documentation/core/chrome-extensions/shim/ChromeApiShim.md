# ChromeApiShim

`core/chrome-extensions/shim/ChromeApiShim.js`

Rewrites an extension folder so [chrome-api-shim.js](chrome-api-shim.md)
loads before the extension's own code. `ChromeExtensionService._copyIntoStore`
runs it on the store copy of every install (unpacked or Chrome Web Store), never
on the user's source folder.

## Methods

- `ChromeApiShim.apply(dir)` returns `{ background, pages }`. It copies the shim
  in as `luma-chrome-shim.js`, then:
  - MV3 `background.service_worker`: writes `luma-chrome-shim-worker.js` beside
    the original worker (so the original's relative `importScripts` still
    resolve) holding `importScripts('/luma-chrome-shim.js', '/<original>')`, or
    two `import` statements when `background.type` is `module`, and points the
    manifest at the wrapper. `background` is `'worker'`.
  - MV2 `background.scripts`: prepends the shim file. `background` is
    `'scripts'`.
  - MV2 `background.page`: tags the page. `background` is `'page'`.
  - Every page named by `PAGE_FIELDS` (action, browser_action and page_action
    popups, options page, side panel, devtools page, URL overrides) that exists
    in the folder gets `<script src="/luma-chrome-shim.js"></script>` right
    after `<head>`, else before the first `<script>`, else at the top. Sandboxed
    pages are skipped: they have no `chrome` to patch. Paths that escape the
    folder are ignored.
  - Writes the manifest back. Running it again changes nothing.
- `ChromeApiShim.pagesOf(manifest)`: the page paths above, deduplicated.
- `ChromeApiShim.workerSource(original, isModule)`, `withScriptTag(html)`:
  the generated texts, exposed for tests.

## Why

Electron does not let the app inject a script into an extension's service
worker or pages, so the folder itself has to load the shim first. Root-absolute
URLs resolve against the `chrome-extension://<id>/` origin from any folder, and
the extension's own `script-src 'self'` policy allows them.

## Refreshing an installed folder

`apply(dir)` is safe to run on a folder it already prepared, and
`ChromeExtensionService.init` does so at every start. When the manifest's
worker is already a wrapper (any `luma-chrome-shim-worker*.js`), the
extension's own worker is read back from it (`wrappedTarget`) and the wrapper
is written again under the fixed name `luma-chrome-shim-worker.js`; a wrapper
under another name is deleted. The name stays fixed because Chromium keeps an
extension worker registered at its first URL until the extension's version
changes.

`shimHash()` is a sha256 prefix of `chrome-api-shim.js`, the version
[WorkerRegistrations](WorkerRegistrations.md) records per worker.
