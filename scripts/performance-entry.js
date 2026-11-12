const path = require('path');
const electron = require('electron');
const PerformanceEntry = require('../tools/perf/PerformanceEntry');

new PerformanceEntry(path.resolve(__dirname, '..'), { electron }).execute();
