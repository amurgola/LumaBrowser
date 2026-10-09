'use strict';

const path = require('path');
const VersionBumper = require('../tools/build/release/VersionBumper');

const { results, version, consistent } = new VersionBumper(path.join(__dirname, '..')).execute();
for (const { rel, from, to } of results) console.log(`${rel}: ${from} -> ${to}`);
if (!consistent) console.warn('WARNING: files disagree on the new version; fix them to match before shipping.');
console.log(`VERSION=${version}`);
