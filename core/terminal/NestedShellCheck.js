class NestedShellCheck {
  static DIALECT = 'powershell';
  static WRAPPER = /^\s*(?:powershell|pwsh)(?:\.exe)?\s+(?:-\w+\s+)*-(?:c|command)\s+"([\s\S]*)$/i;
  static BROKEN_BY_OUTER_SHELL = /\$[\w({]|\\"/;

  static REFUSAL = [
    'This command was NOT typed. It wraps the command in powershell -Command "...", but this terminal is already',
    'PowerShell: the outer shell would expand the $variables and read the \\" of that line before the inner one sees',
    'them, and the command would arrive broken. Send the command line itself, exactly as you would type it at the',
    'prompt, with no powershell -Command around it. If you do mean to start a second PowerShell, send this line',
    'again unchanged and it is typed as it is.',
  ].join(' ');

  constructor() {
    this._sentBack = new Map();
  }

  refusal(terminalId, dialect, command) {
    if (dialect !== NestedShellCheck.DIALECT) return null;
    if (this._insists(terminalId, command) || !NestedShellCheck.breaks(command)) return null;
    this._sentBack.set(terminalId, command);
    return NestedShellCheck.REFUSAL;
  }

  static breaks(command) {
    const wrapped = NestedShellCheck.WRAPPER.exec(String(command || ''));
    return !!wrapped && NestedShellCheck.BROKEN_BY_OUTER_SHELL.test(wrapped[1]);
  }

  _insists(terminalId, command) {
    const insists = this._sentBack.get(terminalId) === command;
    this._sentBack.delete(terminalId);
    return insists;
  }
}

module.exports = NestedShellCheck;
