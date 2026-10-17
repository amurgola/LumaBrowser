'use strict';

const path = require('path');
const VersionBumper = require('../tools/build/release/VersionBumper');

const args = process.argv.slice(2);
const bumper = new VersionBumper(path.join(__dirname, '..'));

if (args.includes('--current')) {
  const { results, version, consistent } = bumper.current();
  for (const { rel, version: held } of results) console.log(`${rel}: ${held}`);
  if (!consistent) console.warn('WARNING: files disagree on the version; realign them with --to <x.y.z>.');
  console.log(`VERSION=${version}`);
} else {
  const toIdx = args.indexOf('--to');
  const target = toIdx >= 0 ? args[toIdx + 1] : undefined;
  if (toIdx >= 0 && !target) {
    console.error('--to needs a version, e.g. --to 2.1.0');
    process.exit(2);
  }
  let outcome;
  try {
    outcome = bumper.execute(target);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
  const { results, version, consistent } = outcome;
  for (const { rel, from, to } of results) console.log(`${rel}: ${from} -> ${to}`);
  if (!consistent) console.warn('WARNING: files disagree on the new version; fix them to match before shipping.');
  console.log(`VERSION=${version}`);
}
