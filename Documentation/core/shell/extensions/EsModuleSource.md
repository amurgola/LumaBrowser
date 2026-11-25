# EsModuleSource

`core/shell/extensions/EsModuleSource.js`

Tells whether an extension UI script is an ES module, so renderers, Setup-tab bundles and chat bundles
load as what they are, bundled or installed.

## Methods

- `EsModuleSource.isModule(file)`: true when a line starts with an `import` or `export` statement
  (`import X from`, `import {`, `import *`, `import './x'`, `export default`, `export {`). A dynamic
  `import(` works in classic scripts and does not count; comments and words such as `importantThing`
  do not match. A missing or unreadable file is false (it loads, and fails, as a classic script).
- `EsModuleSource.STATEMENT`: the pattern.

## Used by

[RendererExtensionList](RendererExtensionList.md) (`rendererModule`) and
[ExtensionWiring](ExtensionWiring.md) `isModuleFile` (the chat UI and Setup tab module flags, also
used by [ChatSurface](ChatSurface.md)).
