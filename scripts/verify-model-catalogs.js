#!/usr/bin/env node

const CatalogUrlVerifier = require('../tools/catalogs/CatalogUrlVerifier');

new CatalogUrlVerifier().execute(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e) => { console.error(`[catalogs] verify failed: ${e && e.message}`); process.exit(2); },
);
