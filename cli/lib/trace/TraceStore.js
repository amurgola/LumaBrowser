const fs = require('fs');
const path = require('path');
const LumaHome = require('../connect/LumaHome');

class TraceStore {
  static POINTER_FILE_NAME = 'traces.json';

  static pointerFile() {
    return LumaHome.file(TraceStore.POINTER_FILE_NAME);
  }

  static resolveDir(env = process.env) {
    if (env.LUMA_TRACE_DIR) return env.LUMA_TRACE_DIR;
    try {
      const j = JSON.parse(fs.readFileSync(TraceStore.pointerFile(), 'utf8'));
      if (j && typeof j.dir === 'string') return j.dir;
    } catch (_) {}
    return null;
  }

  static listFiles(dir) {
    let names = [];
    try { names = fs.readdirSync(dir); } catch (_) { return []; }
    return names
      .filter((n) => n.endsWith('.jsonl') && !n.endsWith('.1.jsonl'))
      .map((n) => TraceStore._entry(dir, n))
      .sort((a, b) => b.mtime - a.mtime);
  }

  static find(dir, files, id) {
    if (id === 'last') return files.find((f) => f.id !== '_side') || files[0] || null;
    const listed = files.find((f) => f.id === id);
    if (listed) return listed;
    const file = path.join(dir, `${id}.jsonl`);
    return fs.existsSync(file) ? { id, file } : null;
  }

  static readRecords(file) {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return []; }
    const out = [];
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t) continue;
      try { out.push(JSON.parse(t)); } catch (_) {}
    }
    return out;
  }

  static _entry(dir, name) {
    const file = path.join(dir, name);
    let st = null;
    try { st = fs.statSync(file); } catch (_) { st = null; }
    return { id: name.replace(/\.jsonl$/, ''), file, mtime: st ? st.mtimeMs : 0, size: st ? st.size : 0 };
  }
}

module.exports = TraceStore;
