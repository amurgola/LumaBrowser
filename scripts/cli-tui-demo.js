#!/usr/bin/env node

const CliTuiDemo = require('../tools/site-replays/CliTuiDemo');

new CliTuiDemo().execute(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (e) => { console.error(e); process.exitCode = 1; },
);
