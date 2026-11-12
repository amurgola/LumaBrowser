#!/usr/bin/env node

const path = require('path');
const { _electron: electron } = require('playwright');
const PerformanceProfiler = require('../tools/perf/PerformanceProfiler');

new PerformanceProfiler(path.resolve(__dirname, '..'), { electron, electronPath: require('electron') })
  .execute(process.argv.slice(2))
  .catch((error) => { console.error(error); process.exitCode = 1; });
