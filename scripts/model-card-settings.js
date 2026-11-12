#!/usr/bin/env node

const path = require('path');
const CardSettingsCli = require('../tools/models/CardSettingsCli');

new CardSettingsCli(path.resolve(__dirname, '..'))
  .execute(process.argv.slice(2))
  .then(() => { process.exit(0); })
  .catch((error) => { console.error(error.message || error); process.exit(2); });
