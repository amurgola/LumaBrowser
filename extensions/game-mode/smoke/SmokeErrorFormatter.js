class SmokeErrorFormatter {
  static PLAY_URL = /\/api\/ext\/game-mode\/play\/[^/]+\/(.+?)(?:\?.*)?$/;

  static prettySource(s) {
    const str = String(s || '');
    if (!str || str.includes('__smoke__')) return '';
    if (/game\.html/.test(str) || /^file:/.test(str)) return 'index.html (inline)';
    const m = str.match(SmokeErrorFormatter.PLAY_URL);
    return m ? m[1] : str;
  }

  static stackFrames(stack, max) {
    const out = [];
    for (const rawLine of String(stack || '').split('\n')) {
      const t = rawLine.trim();
      if (!t.startsWith('at ') || SmokeErrorFormatter._isNoise(t)) continue;
      out.push(t
        .replace(/file:\/\/[^\s)]*game\.html/g, 'index.html')
        .replace(/https?:\/\/[^\s)]*\/api\/ext\/game-mode\/play\/[^/]+\//g, ''));
      if (out.length >= max) break;
    }
    return out;
  }

  static format(e, i) {
    const frames = SmokeErrorFormatter.stackFrames(e.stack, 2);
    const { where, line } = SmokeErrorFormatter._location(e, frames);
    const loc = where ? ` at ${where}${line ? `:${line}` : ''}` : '';
    const times = e.count > 1 ? ` (x${e.count})` : '';
    const head = `${i + 1}. ${e.message}${loc}${times}`;
    return frames.length ? `${head}\n   ${frames.join('\n   ')}` : head;
  }

  static _isNoise(frame) {
    return frame.includes('phaser.min.js') || frame.includes('__smoke__') || frame.includes('collector.js');
  }

  static _location(e, frames) {
    const m = frames.length ? frames[0].match(/\(?([^\s()]+):(\d+):\d+\)?$/) : null;
    if (m) return { where: SmokeErrorFormatter.prettySource(m[1]), line: Number(m[2]) };
    return { where: SmokeErrorFormatter.prettySource(e.source), line: e.line };
  }
}

module.exports = SmokeErrorFormatter;
