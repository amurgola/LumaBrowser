const CodeTool = require('../CodeTool');
const CoreRequire = require('../../CoreRequire');
const CommandText = require('./CommandText');

const DetachedProcesses = CoreRequire.require('shell/DetachedProcesses');

class CheckProcessTool extends CodeTool {
  constructor({ workspace, truncator }) {
    super();
    this._workspace = workspace;
    this._truncator = truncator;
  }

  get name() {
    return 'check_process';
  }

  get description() {
    return 'Check on a command that run_command left running in the background (you were given its pid). '
      + 'action "status" reports running or exited with the exit code and how long it ran; "tail" returns the '
      + 'last part of its log; "kill" stops it. Only processes started by run_command in this session are known.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        pid: { type: 'number', description: 'The pid run_command reported' },
        action: { type: 'string', enum: ['status', 'tail', 'kill'], description: 'What to do (default status)' },
        tail_bytes: { type: 'number', description: 'For tail: how many bytes from the end of the log (default 4096, max 262144)' },
      },
      required: ['pid'],
    };
  }

  get mutating() {
    return false;
  }

  async handle(params) {
    this._workspace.begin();
    const pid = Number(params && params.pid);
    if (!Number.isFinite(pid) || pid <= 0) return { success: false, error: 'pid is required' };
    const st = DetachedProcesses.status(pid);
    if (!st) return { success: false, error: `No background process with pid ${pid} was started by run_command in this session.` };
    const headLine = `pid ${st.pid}: ${CommandText.head(st.command, 80)} · ${CheckProcessTool._state(st)}`;
    const action = String((params && params.action) || 'status');
    if (action === 'kill') return CheckProcessTool._kill(pid, headLine);
    if (action === 'tail') return this._tail(pid, st, headLine, params.tail_bytes);
    return CheckProcessTool._status(pid, st, headLine);
  }

  static _state(st) {
    if (st.running) return `running for ${CommandText.duration(st.durationMs)}`;
    const how = st.killed ? 'killed' : `exited with code ${CommandText.exitCodeText(st)}`;
    return `${how} after ${CommandText.duration(st.durationMs)}`;
  }

  static _kill(pid, headLine) {
    const r = DetachedProcesses.kill(pid);
    return {
      success: r.ok,
      ...(r.ok ? {} : { error: r.reason }),
      message: r.ok ? `${headLine}\n[kill signal sent to pid ${pid} and its children]` : `${headLine}\n[not killed: ${r.reason}]`,
      summary: r.ok ? `pid ${pid} · killed` : `pid ${pid} · ${r.reason}`,
    };
  }

  _tail(pid, st, headLine, tailBytes) {
    const t = DetachedProcesses.tail(pid, tailBytes);
    const bounded = this._truncator.truncate((t && t.text) || '', { strategy: 'tail' });
    const body = bounded.text.trim() ? bounded.text : '(log is empty so far)';
    return {
      success: true,
      running: st.running,
      exitCode: st.exitCode,
      message: `${headLine}\n[log: ${(t && t.logPath) || '(none)'}, ${Math.round(((t && t.totalBytes) || 0) / 1024)} KB]\n${body}`,
      summary: CheckProcessTool._summary(pid, st),
    };
  }

  static _status(pid, st, headLine) {
    return {
      success: true,
      running: st.running,
      exitCode: st.exitCode,
      logPath: st.logPath,
      message: `${headLine}\n[log: ${st.logPath || '(none)'}]`,
      summary: CheckProcessTool._summary(pid, st),
    };
  }

  static _summary(pid, st) {
    return `pid ${pid} · ${st.running ? 'running' : `exit ${st.exitCode}`}`;
  }
}

module.exports = CheckProcessTool;
