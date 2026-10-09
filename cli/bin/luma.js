#!/usr/bin/env node

const AgentCli = require('../lib/AgentCli');

AgentCli.main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; setTimeout(() => process.exit(code), 50); },
  (e) => { process.stderr.write(`luma: ${e && e.message ? e.message : e}\n`); process.exit(1); },
);
