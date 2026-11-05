# ExtensionScriptLoader

`core/llm-server/ui/js/setup-ui/extensions/ExtensionScriptLoader.js`

Injects an extension's Setup-tab UI bundle once per URL: `type="module"` for bundled module entries, a classic script for add-ons and distributable extensions.

## Methods

- `inject(url, asModule, onError?)`: appends `<script src async=false>` to `<head>`; returns false for an empty or already injected URL. `onError(url)` is bound to the script's `error` event (a refused download, or for a module a failed import graph), so the host can report it instead of leaving the pane loading.

## Globals

Writes `<head>`.
