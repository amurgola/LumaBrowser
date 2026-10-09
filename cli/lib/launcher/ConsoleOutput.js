class ConsoleOutput {
  static RED = '\x1b[31m';
  static GREEN = '\x1b[32m';
  static YELLOW = '\x1b[33m';
  static CYAN = '\x1b[36m';
  static DIM = '\x1b[2m';
  static RESET = '\x1b[0m';

  constructor({ stdout = process.stdout, stderr = process.stderr } = {}) {
    this.stdout = stdout;
    this.stderr = stderr;
  }

  log(m) { this.stdout.write(`${m}\n`); }

  info(m) { this._colored(this.stdout, ConsoleOutput.CYAN, m); }

  ok(m) { this._colored(this.stdout, ConsoleOutput.GREEN, m); }

  warn(m) { this._colored(this.stdout, ConsoleOutput.YELLOW, m); }

  err(m) { this._colored(this.stderr, ConsoleOutput.RED, m); }

  progress(text) { this.stdout.write(text); }

  _colored(stream, code, m) {
    stream.write(`${code}${m}${ConsoleOutput.RESET}\n`);
  }
}

module.exports = ConsoleOutput;
