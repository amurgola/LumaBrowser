const GgufParser = require('./GgufParser');

class GgufHeaderParseWorker {
  static listen(parentPort) {
    parentPort.on('message', (request) => GgufHeaderParseWorker.handle(parentPort, request));
  }

  static async handle(parentPort, { id, filePath }) {
    parentPort.postMessage({ id, res: await GgufHeaderParseWorker._parse(filePath) });
  }

  static async _parse(filePath) {
    try {
      return await GgufParser.parseHeader(filePath);
    } catch (err) {
      return { ok: false, error: (err && err.message) || String(err), bytesRead: 0, durationMs: 0 };
    }
  }
}

module.exports = GgufHeaderParseWorker;
