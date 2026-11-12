#!/usr/bin/env node

const RuntimeTraceSummaryCommand = require('../tools/perf/RuntimeTraceSummaryCommand');

process.exitCode = RuntimeTraceSummaryCommand.run(process.argv.slice(2));
