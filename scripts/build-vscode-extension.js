#!/usr/bin/env node

const path = require('path');
const VscodeExtensionBuilder = require('../tools/ide/VscodeExtensionBuilder');

new VscodeExtensionBuilder(path.resolve(__dirname, '..')).execute(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(`[vscode] build failed: ${e && e.message}`); process.exit(1); },
);
