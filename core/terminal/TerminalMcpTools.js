const McpResult = require('../shell/McpResult');
const CommandCallAssessor = require('../llm-server/chat/approval/CommandCallAssessor');

class TerminalMcpTools {
  static SOURCE = 'core.terminal';
  static ACCESS_OFF = 'AI use of the terminal is switched off. The user can turn it on in Settings, under Terminal: "Let AI use the terminal".';
  static DEFAULT_RUN_SECONDS = 30;
  static MAX_RUN_SECONDS = 600;
  static MAX_WAIT_SECONDS = 300;
  static DIALECTS = Object.freeze({ powershell: 'powershell', bash: 'bash', zsh: 'bash', fish: 'bash' });

  static ID = { id: { type: 'string', description: 'Terminal id from terminal_list or terminal_open (for example "t1"). Omit to use the terminal you used last.' } };

  static TOOLS = [
    {
      name: 'terminal_list',
      description: 'List the open terminals (id, shell, folder, what is running, whether the user took it over) and the profiles a new terminal can be opened with.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'terminal_open',
      mutating: true,
      description: 'Open a terminal: a real interactive shell on the user\'s computer (PowerShell on Windows, the login shell on macOS and Linux) that stays open between calls, keeps its folder, variables and running programs, and is shown to the user in a browser tab where they can watch and type. Use it for work that needs a session: REPLs, ssh, dev servers, installers that ask questions, full-screen programs. A profile can also be a command-line app from terminal_list. Replies with the terminal id and its first screen.',
      inputSchema: {
        type: 'object',
        properties: {
          profile: { type: 'string', description: 'Profile id from terminal_list (a shell or a CLI app). Default: the user\'s default shell.' },
          cwd: { type: 'string', description: 'Folder to start in. Default: the user\'s home folder.' },
        },
        required: [],
      },
    },
    {
      name: 'terminal_run',
      mutating: true,
      description: 'Type one command line into a terminal, press Enter and wait until it finishes. Replies with what it printed, its exit code when the shell reports one, and the folder afterwards. The command runs in the terminal\'s own shell, so write it in that shell\'s language (terminal_list names the shell). Status "done" means the prompt is back; "running" means it was still going when the wait ended (terminal_read with wait_seconds keeps waiting, terminal_send with keys ["ctrl+c"] stops it); "waiting" means it stopped mid-line and is probably asking something (answer with terminal_send). With no id and no terminal open, one is opened.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TerminalMcpTools.ID,
          command: { type: 'string', description: 'The command line to run' },
          timeout_seconds: { type: 'number', description: `How long to wait for it to finish (default ${TerminalMcpTools.DEFAULT_RUN_SECONDS}, max ${TerminalMcpTools.MAX_RUN_SECONDS}). The command keeps running after the wait ends.` },
        },
        required: ['command'],
      },
    },
    {
      name: 'terminal_send',
      mutating: true,
      description: 'Send keyboard input to whatever program is in front in a terminal: answer a question, type into a REPL or an ssh session, or drive a full-screen program (an editor, a pager, a menu). text is typed as is; submit presses Enter after it; keys are named keys sent after the text, e.g. ["ctrl+c"], ["escape", ":", "q", "enter"], ["down", "down", "enter"]. Replies with the screen once it has settled. To run a shell command and get its result, use terminal_run instead.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TerminalMcpTools.ID,
          text: { type: 'string', description: 'Text to type' },
          submit: { type: 'boolean', description: 'Press Enter after the text' },
          keys: { type: 'array', items: { type: 'string' }, description: 'Named keys: enter, tab, escape, space, backspace, delete, up, down, left, right, home, end, pageup, pagedown, f1..f12, ctrl+<letter>, alt+<key>, shift+tab' },
        },
        required: [],
      },
    },
    {
      name: 'terminal_read',
      description: 'Read a terminal without typing. mode "new" (default) is everything printed since you last ran or read, including what the user typed; "screen" is the visible screen (use it for full-screen programs); "tail" is the last lines of the scrollback. wait_seconds waits first: for the text or regular expression in until, else for the running command to finish, else for the output to go quiet.',
      inputSchema: {
        type: 'object',
        properties: {
          ...TerminalMcpTools.ID,
          mode: { type: 'string', enum: ['new', 'screen', 'tail'], description: 'What to read (default new)' },
          lines: { type: 'number', description: 'For mode tail: how many lines (default 60)' },
          wait_seconds: { type: 'number', description: `Wait up to this long before reading (max ${TerminalMcpTools.MAX_WAIT_SECONDS})` },
          until: { type: 'string', description: 'With wait_seconds: stop waiting when this text or regular expression appears' },
        },
        required: [],
      },
    },
    {
      name: 'terminal_close',
      mutating: true,
      description: 'Close a terminal and end everything running in it. Its tab closes too.',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Terminal id' } }, required: ['id'] },
    },
  ];

  constructor({ service, settings, viewers, db = null }) {
    this._service = service;
    this._settings = settings;
    this._viewers = viewers;
    this._db = db;
    this._lastId = null;
    this._routes = this._buildRoutes();
  }

  handler() {
    return (toolName, args) => this._handle(toolName, args || {});
  }

  async _handle(toolName, args) {
    const route = this._routes[toolName];
    if (!route) return McpResult.error(`Unknown terminal tool: ${toolName}`);
    if (!this._settings.agentAccess()) return McpResult.error(TerminalMcpTools.ACCESS_OFF);
    try {
      return await route(args);
    } catch (e) {
      return McpResult.error(e.message || 'terminal tool failed');
    }
  }

  _buildRoutes() {
    return {
      terminal_list: () => this._list(),
      terminal_open: (args) => this._open(args),
      terminal_run: (args) => this._run(args),
      terminal_send: (args) => this._send(args),
      terminal_read: (args) => this._read(args),
      terminal_close: (args) => this._close(args),
    };
  }

  _list() {
    const profiles = this._service.profiles;
    const chosen = profiles.defaultProfile();
    return McpResult.text({
      terminals: this._service.list().map((session) => TerminalMcpTools._brief(session)),
      profiles: profiles.list().map((profile) => ({ id: profile.id, name: profile.label, kind: profile.kind, default: !!chosen && chosen.id === profile.id })),
    });
  }

  async _open(args) {
    const session = await this._openShown({ profileId: args.profile || null, cwd: args.cwd || null });
    const first = await this._service.agentRead(session.id, { mode: 'screen' });
    return TerminalMcpTools._text(`${TerminalMcpTools._head(session.id, [session.label, 'opened'], first)}\n${first.text || ''}`);
  }

  async _openShown(options) {
    const session = await this._service.open({ ...options, origin: 'agent' });
    this._viewers.openTab({ sessionId: session.id, profileId: session.profileId, cwd: session.cwd, activate: false });
    this._lastId = session.id;
    return session;
  }

  async _run(args) {
    const command = String(args.command || '').trim();
    if (!command) return McpResult.error('command is required');
    const id = await this._idFor(args, { openWhenNone: true });
    const refusal = this._classifierRefusal(id, command);
    if (refusal) return McpResult.error(refusal);
    const seconds = TerminalMcpTools._clamp(args.timeout_seconds, TerminalMcpTools.DEFAULT_RUN_SECONDS, TerminalMcpTools.MAX_RUN_SECONDS);
    const result = await this._service.agentRun(id, { command, timeoutMs: seconds * 1000 });
    if (result.error) return McpResult.error(result.error);
    const facts = [result.status, result.exitCode == null ? null : `exit code ${result.exitCode}`, `${(result.durationMs / 1000).toFixed(1)} s`];
    return TerminalMcpTools._text([TerminalMcpTools._head(id, facts, result), result.output, TerminalMcpTools._runHint(result, seconds)].filter(Boolean).join('\n'));
  }

  async _send(args) {
    const id = await this._idFor(args);
    const result = await this._service.agentSend(id, { text: args.text == null ? '' : String(args.text), keys: Array.isArray(args.keys) ? args.keys : [], submit: !!args.submit });
    if (result.error) return McpResult.error(result.error);
    return TerminalMcpTools._text(`${TerminalMcpTools._head(id, ['screen after input'], result)}\n${result.screen}`);
  }

  async _read(args) {
    const id = await this._idFor(args);
    const waitMs = TerminalMcpTools._clamp(args.wait_seconds, 0, TerminalMcpTools.MAX_WAIT_SECONDS) * 1000;
    const mode = ['new', 'screen', 'tail'].includes(args.mode) ? args.mode : 'new';
    const result = await this._service.agentRead(id, { mode, lines: args.lines, waitMs, until: args.until || null });
    if (result.error) return McpResult.error(result.error);
    const waited = result.waited ? `wait ended: ${result.waited}` : null;
    return TerminalMcpTools._text(`${TerminalMcpTools._head(id, [mode, waited], result)}\n${result.text || '(nothing new)'}`);
  }

  async _close(args) {
    const closed = await this._service.close(String(args.id || ''));
    if (!closed.success) return McpResult.error(closed.error || 'Unknown terminal');
    if (this._lastId === args.id) this._lastId = null;
    return McpResult.text({ success: true, closed: args.id });
  }

  async _idFor(args, { openWhenNone = false } = {}) {
    const named = args.id ? String(args.id) : null;
    if (named) {
      if (!this._service.get(named)) throw new Error(`No terminal with id ${named}. terminal_list shows the open ones.`);
      this._lastId = named;
      return named;
    }
    if (this._lastId && this._service.get(this._lastId)) return this._lastId;
    if (!openWhenNone) throw new Error('No terminal is open. Open one with terminal_open, or run a command with terminal_run.');
    return (await this._openShown({})).id;
  }

  _classifierRefusal(id, command) {
    if (!CommandCallAssessor.isEnabled(this._db)) return null;
    const profile = this._service.profiles.get(this._service.get(id).profileId);
    const dialect = profile && TerminalMcpTools.DIALECTS[profile.family];
    const verdict = CommandCallAssessor.assess('terminal_run', { command }, { dialect });
    if (!verdict || verdict.verdict !== 'deny') return null;
    return `This command is not allowed (${verdict.reasons.join('; ') || verdict.tier}). It was not run.`;
  }

  static _brief(session) {
    return {
      id: session.id, shell: session.label, cwd: session.cwd,
      state: session.exited ? 'exited' : (session.integrated ? (session.busy ? 'running a command' : 'at the prompt') : 'unknown'),
      running: session.command || undefined, openedBy: session.origin, userTookOver: session.held || undefined,
    };
  }

  static _head(id, facts, position) {
    const where = [position.cwd, position.fullScreenProgram ? 'full-screen program' : null, position.shell === 'exited' ? 'shell exited' : null];
    return `[terminal ${id} | ${[...facts, ...where].filter(Boolean).join(' | ')}]`;
  }

  static _runHint(result, seconds) {
    if (result.status === 'running') return `[Still running after ${seconds} s. terminal_read with wait_seconds keeps waiting; terminal_send with keys ["ctrl+c"] stops it.]`;
    if (result.status === 'waiting') return '[Output stopped in the middle of a line: the program may be waiting for an answer. Reply with terminal_send, or wait with terminal_read.]';
    if (result.status === 'quiet') return '[This shell does not report when a command ends; its output has gone quiet. terminal_read with wait_seconds waits for more.]';
    if (result.truncated) return '[The middle of the output was cut. terminal_read with mode "tail" shows more of the end.]';
    return null;
  }

  static _text(text) {
    return { content: [{ type: 'text', text }] };
  }

  static _clamp(value, fallback, max) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.min(max, number) : fallback;
  }
}

module.exports = TerminalMcpTools;
