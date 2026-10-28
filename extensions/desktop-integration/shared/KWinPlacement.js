const KWinScripting = require('./KWinScripting');

class KWinPlacement {
  static RETRY_MS = 250;

  static forSession({ platform = process.platform, env = process.env, scripting = null, ...options } = {}) {
    const link = scripting || KWinScripting.forSession({ platform, env, ...options });
    return link ? new KWinPlacement({ scripting: link, ...options }) : null;
  }

  constructor({ scripting, pid = process.pid, log = null, setTimeout: st = setTimeout } = {}) {
    this._scripting = scripting;
    this._pid = pid;
    this._log = log;
    this._setTimeout = st;
    this._reported = false;
  }

  get available() {
    return this._scripting ? this._scripting.available : false;
  }

  async move({ caption, x, y }) {
    if (!this._scripting || this._scripting.available === false) return this._off();
    const ok = await this._scripting.runOnce(KWinPlacement.script({ caption, pid: this._pid, x, y }), 'place');
    if (!ok) return this._off();
    this._setTimeout(() => { this._scripting.runOnce(KWinPlacement.script({ caption, pid: this._pid, x, y }), 'place').catch(() => {}); }, KWinPlacement.RETRY_MS);
    return true;
  }

  static script({ caption, pid, x, y }) {
    return [
      '(function () {',
      '  const list = workspace.windowList ? workspace.windowList() : (workspace.clientList ? workspace.clientList() : []);',
      '  for (const w of list) {',
      `    if (w.caption !== ${JSON.stringify(String(caption))}) continue;`,
      `    if (${Number(pid) || 0} && w.pid && w.pid !== ${Number(pid) || 0}) continue;`,
      `    w.frameGeometry = { x: ${Math.round(x)}, y: ${Math.round(y)}, width: w.frameGeometry.width, height: w.frameGeometry.height };`,
      "    if ('keepAbove' in w) w.keepAbove = true;",
      '    if (typeof workspace.raiseWindow === "function") workspace.raiseWindow(w);',
      '  }',
      '})();',
      '',
    ].join('\n');
  }

  _off() {
    if (!this._reported && this._log && typeof this._log.warn === 'function') {
      this._log.warn('KWin placement is off; the island stays where the compositor puts it.');
    }
    this._reported = true;
    return false;
  }
}

module.exports = KWinPlacement;
