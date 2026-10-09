const { parentPort, workerData } = require('worker_threads');
const FilterBuildWorker = require('./FilterBuildWorker');

FilterBuildWorker.run(parentPort, workerData).catch((error) => { throw error; });
