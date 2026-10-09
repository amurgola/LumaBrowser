# BytecodeStub

`tools/build/bytecode/BytecodeStub.js`

The loader stub that replaces a compiled file:
`'use strict'; require('bytenode'); module.exports = require('./X.jsc');`.

## Methods

- `BytecodeStub.text(jscName)`, `isStub(content)`, `jscPathFor(jsPath)`.
