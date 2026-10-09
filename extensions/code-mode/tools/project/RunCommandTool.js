const CodeTool = require('../CodeTool');
const CoreRequire = require('../../CoreRequire');
const CommandText = require('./CommandText');
const CommandOutputRelay = require('./CommandOutputRelay');

const ContainerPath = CoreRequire.require('shell/ContainerPath');
const CommandCallAssessor = CoreRequire.require('llm-server/chat/approval/CommandCallAssessor');
const ApprovalGate = CoreRequire.require('llm-server/chat/ApprovalGate');
const DetachedProcesses = CoreRequire.require('shell/DetachedProcesses');
const AgentNotices = CoreRequire.require('shared/AgentNotices');

class RunCommandTool extends CodeTool {
  static DEFAULT_DETACH_AFTER_SECONDS = 30;
  static MAX_DETACH_AFTER_SECONDS = 600;
  static DEFAULT_TIMEOUT_MS = 120000;

  constructor({ workspace, truncator, db = null }) {
    super();
    this._workspace = workspace;
    this._truncator = truncator;
    this._db = db;
    this._inContainer = ContainerPath.isContainerPath(workspace.projectPath);
    this._shellDoc = this._describeShell();
  }

  static detachAfterMs(params) {
    const raw = params && params.detach_after_seconds;
    if (raw === undefined || raw === null || raw === '') return RunCommandTool.DEFAULT_DETACH_AFTER_SECONDS * 1000;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(n, RunCommandTool.MAX_DETACH_AFTER_SECONDS) * 1000;
  }

  get name() {
    return 'run_command';
  }

  get description() {
    return `Run one shell command in the project (shell: ${this._shellDoc}; cwd defaults to the project root). `
      + 'Use it to build, test, lint, or inspect state (git status, npm test). Output is captured and bounded; '
      + 'when it is long, the tail is returned and the full log is saved to a file path named in the result. '
      + `A command still running after detach_after_seconds (default ${RunCommandTool.DEFAULT_DETACH_AFTER_SECONDS}) keeps running in the `
      + 'background: you get its pid and log path right away and a note when it exits; follow it with check_process '
      + 'or read_file on the log. Commands that are still waited on time out (default 2 minutes, max 10). '
      + `${this._inContainer ? 'Inside the container a background process is still killed at the timeout. ' : ''}`
      + 'Nothing interactive; never push, publish, or delete outside the project. Prefer read_file/grep/find over '
      + 'cat/findstr for reading code.';
  }

  get inputSchema() {
    const d = RunCommandTool.DEFAULT_DETACH_AFTER_SECONDS;
    return {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command line to run' },
        cwd: { type: 'string', description: 'Subdirectory (relative to the project root) to run in' },
        timeoutSeconds: { type: 'number', description: 'Seconds before a command that is still being waited on is killed (default 120, max 600)' },
        detach_after_seconds: { type: 'number', description: `Seconds to wait before letting the command run on in the background (default ${d}, 0 = never detach, max ${RunCommandTool.MAX_DETACH_AFTER_SECONDS}). Use 0 for a command whose full output you need before continuing.` },
        shell: { type: 'string', enum: ['auto', 'powershell', 'bash', 'sh'], description: 'Shell to use; auto picks the platform default' },
      },
      required: ['command'],
    };
  }

  get mutating() {
    return true;
  }

  async handle(params, opts = {}) {
    const s = this._workspace.begin();
    if (!params || !params.command || !String(params.command).trim()) return { success: false, error: 'command is required' };
    const command = String(params.command).trim();
    const refusal = this._classifierRefusal(s, params, command);
    if (refusal) return refusal;
    const timeoutMs = Number(params.timeoutSeconds) > 0 ? Number(params.timeoutSeconds) * 1000 : undefined;
    const conversationId = (opts && opts.conversationId) || this._workspace.conversationId || null;
    const res = await this._run(s, params, command, timeoutMs, conversationId, opts);
    if (res.error && res.exitCode == null && !res.output && !res.detached) {
      return { success: false, error: res.error, message: `Command failed to run: ${res.error}` };
    }
    if (res.detached) return this._detached(res, command, timeoutMs, conversationId, opts.emit);
    return this._finished(res, command);
  }

  _extraFields() {
    return { projectRoot: this._inContainer ? null : (this._workspace.projectPath || null) };
  }

  _describeShell() {
    if (this._inContainer) return 'bash inside the Linux container, as the container user';
    try {
      const code = this._workspace.code;
      const sh = typeof code.commandShell === 'function' ? code.commandShell('auto') : null;
      if (sh && sh.syntax) return `${sh.syntax} (${sh.name})`;
    } catch (_) {}
    return 'the platform default shell';
  }

  _classifierRefusal(s, params, command) {
    if (!CommandCallAssessor.isEnabled(this._db)) return null;
    const verdict = CommandCallAssessor.assess('run_command', params, {
      projectRoot: s.dir, dialect: this._dialect(params) || undefined,
    });
    if (!verdict || verdict.verdict !== 'deny') return null;
    try { console.warn(`[run_command] refused (${verdict.tier}): ${command}`); } catch (_) {}
    return ApprovalGate.deniedCommandResult('run_command', verdict);
  }

  _dialect(params) {
    try {
      const code = this._workspace.code;
      const sh = typeof code.commandShell === 'function' ? code.commandShell(params.shell || 'auto') : null;
      return this._inContainer ? 'posix' : (sh && sh.syntax ? sh.syntax : null);
    } catch (_) {
      return null;
    }
  }

  async _run(s, params, command, timeoutMs, conversationId, opts) {
    const relay = new CommandOutputRelay(command, opts);
    try {
      return await this._workspace.code.runCommand(s.workspaceId, {
        command, cwd: params.cwd, timeoutMs, shell: params.shell || 'auto', onOutput: (chunk) => relay.onOutput(chunk),
        signal: relay.signal, detachAfterMs: RunCommandTool.detachAfterMs(params), conversationId,
      });
    } finally {
      relay.close();
    }
  }

  _detached(res, command, timeoutMs, conversationId, emit) {
    DetachedProcesses.onExit(res.pid, (e) => AgentNotices.enqueue(conversationId, CommandText.exitNotice(e)));
    try { if (emit) emit({ type: 'command:detached', payload: { command, pid: res.pid, logPath: res.logPath } }); } catch (_) {}
    const bounded = this._truncator.truncate(res.output || '', { strategy: 'tail' });
    const head = `${RunCommandTool._prompt(command, res)}\n[${res.shell}: still running after ${CommandText.duration(res.durationMs)}, detached as pid ${res.pid}]`;
    const body = bounded.text.trim() ? bounded.text : '(no output yet)';
    return {
      success: true,
      detached: true,
      pid: res.pid,
      logPath: res.logPath,
      spillPath: res.logPath,
      exitCode: null,
      timedOut: false,
      message: [head, body, this._followNote(res, timeoutMs)].join('\n'),
      summary: `${CommandText.head(command)} · running (pid ${res.pid})`,
    };
  }

  _followNote(res, timeoutMs) {
    const killedAt = this._inContainer
      ? ` Inside the container it is still killed at the ${Math.round((timeoutMs || RunCommandTool.DEFAULT_TIMEOUT_MS) / 1000)}s timeout.`
      : '';
    return `[The process keeps running; you will get a note when it exits. Log: ${res.logPath || '(no log file)'}. `
      + `Follow it with check_process {"pid": ${res.pid}, "action": "tail"} (or "status" / "kill") or read_file on the log.`
      + `${killedAt}]`;
  }

  _finished(res, command) {
    const bounded = this._truncator.truncate(res.output || '', { strategy: 'tail' });
    const notes = [];
    if (bounded.truncated) notes.push(bounded.notice);
    if (res.spillPath) notes.push(`[Full output (${Math.round(res.outputBytes / 1024)} KB) saved to: ${res.spillPath}]`);
    const head = `${RunCommandTool._prompt(command, res)}\n[${res.shell}: ${RunCommandTool._status(res)} in ${(res.durationMs / 1000).toFixed(1)}s]`;
    const body = bounded.text.trim() ? bounded.text : '(no output)';
    const ok = !res.timedOut && !res.aborted && res.exitCode === 0;
    return {
      success: ok,
      exitCode: res.exitCode,
      timedOut: res.timedOut,
      spillPath: res.spillPath,
      message: [head, body, ...notes].join('\n'),
      summary: `${CommandText.head(command)} · ${RunCommandTool._shortStatus(res)}`,
      ...(ok ? {} : { error: RunCommandTool._error(res) }),
    };
  }

  static _prompt(command, res) {
    return `$ ${command}${res.cwd && res.cwd !== '.' ? `  (in ${res.cwd})` : ''}`;
  }

  static _status(res) {
    if (res.timedOut) return `timed out after ${Math.round(res.durationMs / 1000)}s and was killed`;
    if (res.aborted) return 'was stopped';
    return `exited with code ${res.exitCode}`;
  }

  static _shortStatus(res) {
    if (res.timedOut) return 'timeout';
    if (res.aborted) return 'stopped';
    return `exit ${res.exitCode}`;
  }

  static _error(res) {
    if (res.timedOut) return 'command timed out';
    if (res.aborted) return 'command stopped';
    return `exit code ${res.exitCode}`;
  }
}

module.exports = RunCommandTool;
