#!/usr/bin/env node

const path = require('path');
const SiteReplayBuilder = require('../tools/site-replays/SiteReplayBuilder');

new SiteReplayBuilder(path.resolve(__dirname, '..')).execute(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(e); process.exit(1); },
);
