const { parentPort } = require('worker_threads');
const GgufHeaderParseWorker = require('./GgufHeaderParseWorker');

GgufHeaderParseWorker.listen(parentPort);
