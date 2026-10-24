#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const WindhawkModChecker = require('./WindhawkModChecker');

const REPO = path.resolve(__dirname, '..', '..');
const MODS_DIR = path.join(REPO, 'integrations', 'windhawk');
const CANONICAL = path.join(MODS_DIR, '_shared', 'luma_client.inc.cpp');

function modFiles(args) {
  if (args.length) return args.map((a) => path.resolve(a));
  return fs.readdirSync(MODS_DIR).filter((f) => f.endsWith('.wh.cpp')).sort().map((f) => path.join(MODS_DIR, f));
}

function main(args) {
  const checker = new WindhawkModChecker({ canonicalClient: CANONICAL });
  if (!checker.available()) {
    console.log(`windhawk:check skipped: the Windhawk compiler was not found at ${checker.compiler} (install Windhawk, or set ${WindhawkModChecker.ENV_ROOT}).`);
    return 0;
  }
  const files = modFiles(args);
  if (!files.length) { console.log('windhawk:check: no *.wh.cpp mods found.'); return 0; }
  let failed = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) { console.log(`FAIL ${file}: not found`); failed++; continue; }
    const report = checker.check(file);
    const name = path.relative(REPO, file);
    console.log(`${report.ok ? 'PASS' : 'FAIL'} ${name}${report.id ? ` (${report.id})` : ''}`);
    if (report.error) console.log(`  ${report.error}`);
    if (!report.clientOk) console.log(`  ${report.clientMessage}`);
    for (const r of report.results) {
      console.log(`  ${r.skipped ? 'skip' : r.ok ? 'ok  ' : 'FAIL'} ${r.target}${r.skipped ? `: ${r.output}` : ''}`);
      if (!r.ok && !r.skipped && r.output) console.log(r.output.split('\n').map((l) => `    ${l}`).join('\n'));
      else if (r.ok && r.output) console.log(r.output.split('\n').map((l) => `    warning: ${l}`).join('\n'));
    }
    if (!report.ok) failed++;
  }
  console.log(`${files.length - failed}/${files.length} mod(s) passed.`);
  return failed ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
