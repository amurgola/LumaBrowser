#!/usr/bin/env node

const path = require('path');
const StateProbeCli = require('../tools/roleplay/StateProbeCli');

new StateProbeCli(path.resolve(__dirname, '..'))
  .execute(process.argv.slice(2))
  .then((r) => { process.exit(r && r.failed ? 1 : 0); })
  .catch((error) => { console.error(error.message || error); process.exit(2); });
