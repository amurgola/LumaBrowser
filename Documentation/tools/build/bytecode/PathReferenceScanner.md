# PathReferenceScanner

`tools/build/bytecode/PathReferenceScanner.js`

Finds `.js` files the app loads by file path rather than `require()`:

- `path.join(__dirname, 'a', 'b.js')` / `path.resolve(...)` with literal segments,
- a bare sibling file name literal such as `'TtsWorker.js'` or `'runner-preload.js'`,
- an app-root-relative literal such as `'extensions/ext-ui.js'` (a page URL).

Literals passed straight to `require()` are skipped. Each hit gets a kind:
`preload` (name ends in preload.js), `worker` (the referring file spawns:
`new Worker`, `utilityProcess`, `fork(`, `workerPath`, `WORKER_PATH` /
`WORKER_FILE`) or `path-loaded` (read as text and injected, or loaded by a page).
A false positive only makes a file plain, which is safe.

## Methods

- `PathReferenceScanner.references(tree, rel)` returns `[{ target, referrer, kind }]`.
