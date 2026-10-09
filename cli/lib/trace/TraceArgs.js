class TraceArgs {
  static parse(argv) {
    const o = { id: null, turn: null, call: null, json: false, help: false };
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--turn') o.turn = Number(argv[++i]);
      else if (a === '--call') o.call = Number(argv[++i]);
      else if (a === '--json') o.json = true;
      else if (a === '--calls') {}
      else if (a === '-h' || a === '--help') o.help = true;
      else if (!o.id && !a.startsWith('-')) o.id = a;
    }
    return o;
  }

  static usage() {
    return [
      'luma trace                      list traced conversations',
      'luma trace <id|last>            one line per model call',
      'luma trace <id|last> --turn N   only the Nth turn of the conversation',
      'luma trace <id|last> --call N   dump one call in full',
      'luma trace <id|last> --json     raw JSON lines',
      '',
      'Tracing is off by default: turn on "Trace model calls to disk" in',
      'Settings > General, or launch with --trace-llm (npm run dev:trace).',
    ].join('\n');
  }
}

module.exports = TraceArgs;
