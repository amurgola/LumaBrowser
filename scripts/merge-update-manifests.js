#!/usr/bin/env node
'use strict';

const fs = require('fs');
const UpdateManifestMerger = require('../tools/build/release/UpdateManifestMerger');

const args = process.argv.slice(2);
const intoIdx = args.indexOf('--into');
const into = intoIdx >= 0 ? args[intoIdx + 1] : null;
const from = args.filter((_, i) => i !== intoIdx && i !== intoIdx + 1);
if (!into || from.length === 0) {
  console.error('Usage: node scripts/merge-update-manifests.js --into <primary latest.yml> <secondary latest.yml...>');
  process.exit(2);
}

try {
  const merged = UpdateManifestMerger.merge(fs.readFileSync(into, 'utf8'), from.map((file) => fs.readFileSync(file, 'utf8')));
  fs.writeFileSync(into, merged);
  for (const file of from) fs.unlinkSync(file);
  console.log(`[merge-update-manifests] ${into} now carries ${from.length} more manifest(s):\n${merged}`);
} catch (err) {
  console.error(`[merge-update-manifests] ${err.message}`);
  process.exit(1);
}
