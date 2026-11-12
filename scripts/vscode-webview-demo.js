#!/usr/bin/env node

const path = require('path');
const VscodeWebviewDemo = require('../tools/site-replays/VscodeWebviewDemo');

new VscodeWebviewDemo(path.resolve(__dirname, '..')).execute(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(e); process.exit(1); },
);
