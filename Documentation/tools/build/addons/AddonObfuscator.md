# AddonObfuscator

`tools/build/addons/AddonObfuscator.js`

Obfuscates a staged private add-on in place with javascript-obfuscator
(`OPTIONS`: string array, moderate control-flow flattening; selfDefending and
debugProtection off because they break formatting-sensitive code and trap
devtools). Browser-context files (manifest-served scripts, HTML `<script src>`
targets, ES modules) get the `browser-no-eval` target, everything else `node`.
`manifest.js` and anything under `node_modules`, `lib` or `handlers` stays readable.

## Methods

- `new AddonObfuscator({ obfuscator, log })`; `obfuscateTree(stageDir, manifest)`
  returns `[{ file, target }]`; `AddonObfuscator.browserFiles(tree, manifest)`.
