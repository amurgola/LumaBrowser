#!/usr/bin/env node

const HfDownloadCli = require('../tools/models/HfDownloadCli');

new HfDownloadCli()
  .execute(process.argv.slice(2))
  .then(() => process.exit(0))
  .catch((error) => { console.error(error.message || error); process.exit(1); });
