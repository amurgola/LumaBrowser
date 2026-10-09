const ResponseCharset = require('./ResponseCharset');

class CappedBodyReader {
  static read(res, { url, maxBytes }) {
    return new Promise((resolve) => {
      const state = { chunks: [], total: 0, truncated: false };
      res.on('data', (chunk) => CappedBodyReader._collect(res, state, chunk, maxBytes));
      const finish = () => resolve(CappedBodyReader._result(res, state, url));
      res.on('end', finish);
      res.on('close', () => { if (state.chunks.length) finish(); });
      res.on('error', (e) => resolve({ ok: false, error: `Read error: ${e.message}` }));
    });
  }

  static _collect(res, state, chunk, maxBytes) {
    if (state.truncated) return;
    state.total += chunk.length;
    if (state.total <= maxBytes) {
      state.chunks.push(chunk);
      return;
    }
    state.truncated = true;
    state.chunks.push(chunk.slice(0, chunk.length - (state.total - maxBytes)));
    res.destroy();
  }

  static _result(res, state, url) {
    const contentType = res.headers['content-type'] || '';
    const body = Buffer.concat(state.chunks).toString(ResponseCharset.encodingFor(contentType));
    return { ok: true, status: res.statusCode || 0, finalUrl: url, contentType, body, truncated: state.truncated };
  }
}

module.exports = CappedBodyReader;
