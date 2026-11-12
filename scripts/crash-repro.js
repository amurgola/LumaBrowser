#!/usr/bin/env node

const path = require('path');
const CrashRepro = require('../tools/crash/CrashRepro');

new CrashRepro({ root: path.resolve(__dirname, '..'), electronPath: require('electron') }).execute(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(e); process.exit(1); },
);
