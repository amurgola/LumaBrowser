#!/usr/bin/env node

const path = require('path');
const DocsRagBuilder = require('../tools/build/docs-rag/DocsRagBuilder');

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const rootDir = path.join(__dirname, '..');

try {
  const builder = new DocsRagBuilder({ rootDir, outPath: outIdx >= 0 ? path.resolve(args[outIdx + 1]) : undefined });
  const report = builder.run();
  for (const rel of report.skipped) console.warn(`[build-docs-rag] skipped ${rel} (empty or duplicate page)`);
} catch (err) {
  console.error(`[build-docs-rag] ${err.message}`);
  process.exit(1);
}
