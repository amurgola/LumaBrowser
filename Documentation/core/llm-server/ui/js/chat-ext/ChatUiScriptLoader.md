# ChatUiScriptLoader

`core/llm-server/ui/js/chat-ext/ChatUiScriptLoader.js`

Injects extension chat-UI scripts once each: bundled module entries as
`type="module"`, everything else as a classic script, so user-installed add-ons
keep the plain-script contract. The rule and who sets the flag are in
[LumaChatExt](LumaChatExt.md#loading-bundles-rule-for-wave-2-extension-porters-g1-g3).

## Methods

- `ChatUiScriptLoader.isModule(descriptor)`: true only for `descriptor.chatUiModule === true`.
- `new ChatUiScriptLoader(doc?, logger?)`.
- `load(url, { module })` appends `<script src async=false>` (plus `type="module"`)
  to `<head>` once per URL; resolves on load or error (errors are logged as
  `[chat-ext] failed to load mode bundle:`). An empty URL resolves at once.
