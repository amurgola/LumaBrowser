#!/usr/bin/env node

const path = require('path');
const TextRunCli = require('../tools/roleplay/TextRunCli');

new TextRunCli(path.resolve(__dirname, '..'))
  .execute(process.argv.slice(2))
  .then((r) => { process.exit(r && r.error ? 1 : 0); })
  .catch((error) => { console.error(error.message || error); process.exit(2); });
