const fs = require('fs');
const LumaHome = require('./LumaHome');

class HandshakeFile {
  static FILE_NAME = 'cli.json';

  static path(env = process.env) {
    return env.LUMA_CLI_HANDSHAKE || LumaHome.file(HandshakeFile.FILE_NAME);
  }

  static read(file = HandshakeFile.path()) {
    const body = HandshakeFile._readJson(file);
    if (!body || !Number.isInteger(body.port) || typeof body.token !== 'string') return null;
    return body;
  }

  static _readJson(file) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
  }
}

module.exports = HandshakeFile;
