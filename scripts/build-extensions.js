#!/usr/bin/env node

const path = require('path');
const AddonPackager = require('../tools/build/addons/AddonPackager');

new AddonPackager({ rootDir: path.join(__dirname, '..') }).run().catch((err) => {
  console.error(err);
  process.exit(1);
});
