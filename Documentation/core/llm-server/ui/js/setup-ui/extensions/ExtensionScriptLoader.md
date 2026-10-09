# ExtensionScriptLoader

`core/llm-server/ui/js/setup-ui/extensions/ExtensionScriptLoader.js`

Injects an extension's Setup-tab UI bundle once per URL: `type="module"` for bundled module entries, a classic script for add-ons and distributable extensions.

## Methods

- `inject(url, asModule)`: appends `<script src async=false>` to `<head>`; returns false for an empty or already injected URL.

## Globals

Writes `<head>`.
