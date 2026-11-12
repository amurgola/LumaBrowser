const path = require('path');
const RuntimeTraceSummary = require('../../core/diagnostics/RuntimeTraceSummary');

class RuntimeTraceSummaryCommand {
  static USAGE = 'Usage: node scripts/summarize-runtime-trace.js <capture-dir>';

  static run(argv, io = {}) {
    const out = io.out || ((s) => console.log(s));
    const err = io.err || ((s) => console.error(s));
    if (!argv[0]) {
      err(RuntimeTraceSummaryCommand.USAGE);
      return 1;
    }
    const dir = path.resolve(argv[0]);
    const { markdown } = RuntimeTraceSummary.summarize(dir);
    out(markdown);
    out(`Wrote ${path.join(dir, 'summary.json')} and summary.md`);
    return 0;
  }
}

module.exports = RuntimeTraceSummaryCommand;
