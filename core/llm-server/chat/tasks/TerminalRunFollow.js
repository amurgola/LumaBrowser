class TerminalRunFollow {
  static RUN_TOOL = 'terminal_run';
  static READ_TOOL = 'terminal_read';
  static SEND_TOOL = 'terminal_send';
  static RUN_SECONDS = 600;
  static READ_SECONDS = 300;
  static KEEP_CHARS = 24000;
  static HEAD = /^\[terminal (\S+) \| ([^\]]*)\]/;
  static NOTHING_NEW = '(nothing new)';

  constructor({ call, isStopped = () => false, report = () => {} }) {
    this._call = call;
    this._isStopped = isStopped;
    this._report = report;
    this._terminalId = null;
    this._output = '';
  }

  static handles(tool) {
    return tool === TerminalRunFollow.RUN_TOOL;
  }

  run(params) {
    return this.resume(this._call(TerminalRunFollow.RUN_TOOL, { ...params, timeout_seconds: TerminalRunFollow.RUN_SECONDS }));
  }

  async resume(firstResult) {
    let result = await firstResult;
    this._gather(result);
    while (this._stillRunning(result) && !this._isStopped()) {
      result = await this._call(TerminalRunFollow.READ_TOOL, { id: this._terminalId, wait_seconds: TerminalRunFollow.READ_SECONDS });
      this._gather(result);
    }
    return { success: !(result && result.success === false), data: this._output.trim() };
  }

  async stop() {
    if (!this._terminalId) return;
    await this._call(TerminalRunFollow.SEND_TOOL, { id: this._terminalId, keys: ['ctrl+c'] });
  }

  _stillRunning(result) {
    if (!result || result.success === false || !this._terminalId) return false;
    const facts = TerminalRunFollow._facts(TerminalRunFollow._text(result));
    return facts.includes('running') || facts.includes('wait ended: timeout');
  }

  _gather(result) {
    const text = TerminalRunFollow._text(result);
    const head = TerminalRunFollow.HEAD.exec(text);
    if (head) this._terminalId = head[1];
    const body = TerminalRunFollow._withoutHints(head ? text.slice(head[0].length) : text);
    if (!body || body === TerminalRunFollow.NOTHING_NEW) return;
    this._output = (this._output + '\n' + body).slice(-TerminalRunFollow.KEEP_CHARS);
    const lastLine = body.split('\n').map((line) => line.trim()).filter(Boolean).pop();
    if (lastLine) this._report({ detail: lastLine });
  }

  static _text(result) {
    if (!result) return '';
    if (typeof result.data === 'string') return result.data;
    return typeof result.error === 'string' ? result.error : '';
  }

  static _facts(text) {
    const head = TerminalRunFollow.HEAD.exec(text);
    return head ? head[2].split('|').map((fact) => fact.trim()) : [];
  }

  static _withoutHints(body) {
    return body.split('\n').filter((line) => !/^\[(Still running after|This shell does not report)/.test(line.trim())).join('\n').trim();
  }
}

module.exports = TerminalRunFollow;
