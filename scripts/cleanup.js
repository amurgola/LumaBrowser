#!/usr/bin/env node

const ProcessCleanup = require('../tools/dev/ProcessCleanup');

new ProcessCleanup({ dryRun: process.argv.includes('--dry-run') }).execute().then((code) => {
  if (code) process.exit(code);
});
