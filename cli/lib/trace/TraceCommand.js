const TraceArgs = require('./TraceArgs');
const TraceStore = require('./TraceStore');
const TraceTable = require('./TraceTable');

class TraceCommand {
  static run(argv = [], io = {}) {
    return new TraceCommand(io)._run(argv);
  }

  constructor({ out, err, env } = {}) {
    this.out = out || ((s) => process.stdout.write(`${s}\n`));
    this.err = err || ((s) => process.stderr.write(`${s}\n`));
    this.env = env || process.env;
  }

  _run(argv) {
    const o = TraceArgs.parse(argv);
    if (o.help) { this.out(TraceArgs.usage()); return 0; }
    const dir = TraceStore.resolveDir(this.env);
    if (!dir) {
      this.err('No trace directory known yet. Run a chat turn in LumaBrowser first, or set LUMA_TRACE_DIR.');
      return 1;
    }
    const files = TraceStore.listFiles(dir);
    if (!o.id) return this._list(dir, files);
    const target = TraceStore.find(dir, files, o.id);
    if (!target) { this.err(`No trace for "${o.id}" in ${dir}`); return 1; }
    return this._show(target, o);
  }

  _list(dir, files) {
    if (!files.length) {
      this.out(`No traces in ${dir}. Tracing is off by default: enable it in Settings or launch with --trace-llm.`);
      return 0;
    }
    this.out(`Traces in ${dir}`);
    for (const f of files) this.out(TraceTable.fileRow(f));
    return 0;
  }

  _show(target, o) {
    const records = TraceCommand._indexed(TraceStore.readRecords(target.file), o.turn);
    if (Number.isFinite(o.call) && o.call > 0) return this._dumpCall(records, o.call, target.id);
    if (o.json) {
      for (const r of records) this.out(JSON.stringify(TraceCommand._withoutIndex(r)));
      return 0;
    }
    this.out(`${target.id}: ${records.length} call(s)`);
    this.out(TraceTable.header());
    for (const r of records) this.out(TraceTable.callRow(r));
    return 0;
  }

  _dumpCall(records, call, id) {
    const rec = records.find((r) => r._index === call);
    if (!rec) { this.err(`No call ${call} in ${id}`); return 1; }
    this.out(JSON.stringify(TraceCommand._withoutIndex(rec), null, 2));
    return 0;
  }

  static _indexed(records, turn) {
    const turnOf = TraceTable.turnIndex(records);
    const indexed = records.map((r, i) => ({ ...r, _index: i + 1, _turn: turnOf(r) }));
    return Number.isFinite(turn) && turn > 0 ? indexed.filter((r) => r._turn === turn) : indexed;
  }

  static _withoutIndex(r) {
    const { _index, _turn, ...rest } = r;
    return rest;
  }
}

module.exports = TraceCommand;
