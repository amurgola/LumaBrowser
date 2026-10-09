# EsModuleDetector

`tools/build/bytecode/EsModuleDetector.js`

Tells an ES module from CommonJS: a top-level `import`/`export` statement and no
`module.exports` / `exports.x =`. The CommonJS check keeps prompt templates that
contain "export default" text from being misread as modules.

## Methods

- `EsModuleDetector.isEsModule(source)`
