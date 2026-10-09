class SseLineReader {
  static LINE_BREAK = /\r?\n/;

  static read(stream, onLines) {
    return new Promise((resolve, reject) => {
      const state = { buffer: '', settled: false };
      const finish = () => SseLineReader._settle(state, resolve);
      stream.on('data', (chunk) => SseLineReader._onData(stream, state, chunk, onLines, finish));
      stream.on('end', () => SseLineReader._onEnd(state, onLines, finish));
      stream.on('error', (error) => SseLineReader._onError(state, error, reject));
    });
  }

  static _onData(stream, state, chunk, onLines, finish) {
    if (state.settled) return;
    state.buffer += chunk.toString('utf8');
    const lines = state.buffer.split(SseLineReader.LINE_BREAK);
    state.buffer = lines.pop() || '';
    if (!onLines(lines)) return;
    finish();
    SseLineReader._release(stream);
  }

  static _onEnd(state, onLines, finish) {
    if (!state.settled && state.buffer) onLines([state.buffer]);
    finish();
  }

  static _onError(state, error, reject) {
    if (state.settled) return;
    state.settled = true;
    reject(error);
  }

  static _settle(state, resolve) {
    if (state.settled) return;
    state.settled = true;
    state.buffer = '';
    resolve();
  }

  static _release(stream) {
    try { stream.destroy(); } catch (_) {}
  }
}

module.exports = SseLineReader;
