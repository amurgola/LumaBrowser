#!/usr/bin/env node

const path = require('path');
const PerformanceSummary = require('../tools/perf/PerformanceSummary');

const dir = path.resolve(process.argv[2] || 'test-data/performance/run');
const { highlights } = new PerformanceSummary(dir).execute();
console.log(JSON.stringify(highlights, null, 2));
