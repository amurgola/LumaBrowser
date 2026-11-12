#!/usr/bin/env node

const path = require('path');
const LaunchBench = require('../tools/perf/llm/LaunchBench');

new LaunchBench(path.resolve(__dirname, '..'))
  .execute(process.argv.slice(2))
  .then(() => { process.exit(0); })
  .catch((error) => { console.error(error.message || error); process.exit(2); });
