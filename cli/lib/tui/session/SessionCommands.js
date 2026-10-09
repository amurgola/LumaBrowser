const NoteBlock = require('../blocks/NoteBlock');

class SessionCommands {
  static COMMANDS = [
    { name: '/help', help: 'this list' },
    { name: '/agents', help: 'list your agents' },
    { name: '/agent', help: '<name>  switch agent (new conversation)', arg: true },
    { name: '/new', help: 'start a fresh conversation with the same agent' },
    { name: '/resume', help: '<id>  continue an existing conversation', arg: true },
    { name: '/reasoning', help: 'toggle showing the model\'s thinking (ctrl+o)' },
    { name: '/yes', help: 'toggle approvals for this run' },
    { name: '/id', help: 'print the conversation id' },
    { name: '/clear', help: 'clear the screen' },
    { name: '/quit', help: 'leave (ctrl+c twice, ctrl+d also work)' },
  ];

  static KEYS_HELP = 'keys: enter sends · ctrl+j newline · ctrl+o shows or hides thinking · esc stops a turn · ctrl+c clears, twice quits · tab completes · up/down history';
  static NO_AGENTS = 'No agents yet. Create one in LumaBrowser → Setup → Agents.';
  static SESSION_COMMANDS = ['/agent', '/new', '/resume', '/yes'];

  constructor(app) {
    this.app = app;
    this.agentsLoading = false;
  }

  complete(prefix) {
    if (!prefix.startsWith('/')) return null;
    const m = /^(\/agent|\/resume)\s+(\S*)$/.exec(prefix);
    if (m && m[1] === '/agent') return this._agentEntries(m[2]);
    if (prefix.includes(' ')) return null;
    return SessionCommands.COMMANDS.filter((c) => c.name.startsWith(prefix)).map((c) => ({ text: c.name, help: c.help, arg: !!c.arg }));
  }

  async run(line) {
    const app = this.app;
    const [first, ...rest] = line.split(/\s+/);
    const cmd = first === '/' ? '/help' : first;
    const arg = rest.join(' ').trim();
    if (SessionCommands.SESSION_COMMANDS.includes(cmd)) await this._switchSession(cmd, arg);
    else await this._simple(cmd);
    app.requestRender();
  }

  async fetchAgents() {
    const app = this.app;
    app.send('list-agents');
    const p = await app.wait('agents', 8000);
    if (!p || p.__error) {
      app.push(new NoteBlock(`could not list agents: ${(p && p.__error && p.__error.message) || 'no answer'}`, 'bad'));
      return null;
    }
    app.agents = (p.agents || []);
    return app.agents;
  }

  _agentEntries(typed) {
    const app = this.app;
    if (!app.agents) {
      if (!this.agentsLoading) {
        this.agentsLoading = true;
        this.fetchAgents().then(() => { this.agentsLoading = false; app.editor.refreshPalette(); app.requestRender(); });
      }
      return null;
    }
    return app.agents
      .filter((a) => a.name.toLowerCase().startsWith(typed.toLowerCase()))
      .map((a) => ({ text: `/agent ${a.name}`, help: a.description || a.model || '' }));
  }

  async _simple(cmd) {
    const app = this.app;
    switch (cmd) {
      case '/help': case '/?': this._help(); break;
      case '/quit': case '/exit': case '/q': app.quit(); break;
      case '/id': app.push(new NoteBlock(`conversation ${app.conversationId}`)); break;
      case '/clear': this._clear(); break;
      case '/reasoning': app.toggleReasoning(); break;
      case '/agents': await this._listAgents(); break;
      default: app.push(new NoteBlock(`unknown command ${cmd} (try /help)`, 'warn'));
    }
  }

  _help() {
    const w = Math.max(...SessionCommands.COMMANDS.map((c) => c.name.length));
    for (const c of SessionCommands.COMMANDS) this.app.push(new NoteBlock(`${c.name.padEnd(w)}  ${c.help}`));
    this.app.push(new NoteBlock(SessionCommands.KEYS_HELP));
  }

  _clear() {
    const app = this.app;
    app.term.write('\x1b[2J\x1b[H');
    app.screen.invalidate();
    app.blocks = app.blocks.filter((b) => !b.done);
    app.committed = [];
  }

  async _listAgents() {
    const app = this.app;
    const g = app.theme.glyph;
    const list = await this.fetchAgents();
    if (!list) return;
    if (!list.length) { app.push(new NoteBlock(SessionCommands.NO_AGENTS)); return; }
    const w = Math.max(...list.map((a) => a.name.length));
    for (const a of list) {
      const bits = [a.model || '(default model)', `${a.tools} tool${a.tools === 1 ? '' : 's'}`];
      if (a.kbDocs) bits.push(`${a.kbDocs} KB doc${a.kbDocs === 1 ? '' : 's'}`);
      const me = a.name === app.agentName ? ` ${g.arrowL} current` : '';
      app.push(new NoteBlock(`${a.name.padEnd(w)}  ${bits.join(` ${g.dot} `)}${me}${a.description ? `\n${''.padEnd(w)}  ${a.description}` : ''}`));
    }
  }

  async _switchSession(cmd, arg) {
    const app = this.app;
    if (app.streaming) { app.push(new NoteBlock('wait for the current turn to finish first', 'warn')); return; }
    const target = this._target(cmd, arg);
    if (!target) return;
    for (const b of app.blocks) b.done = true;
    app.requestRender();
    const ready = await app.hello(target);
    if (!ready) return;
    app.approvalMode = target.approval;
    app.header(ready, cmd === '/yes' ? `approvals ${target.approval === 'never' ? 'off' : 'on'} for this run` : null);
  }

  _target(cmd, arg) {
    const app = this.app;
    const target = { agent: app.agentName, conversationId: null, approval: app.approvalMode };
    if (cmd === '/agent') {
      if (!arg) { app.push(new NoteBlock('usage: /agent <name>  (or /agent . for the plain Code agent)', 'warn')); return null; }
      target.agent = arg === '.' ? null : arg;
    }
    if (cmd === '/resume') {
      if (!arg) { app.push(new NoteBlock('usage: /resume <conversation id>', 'warn')); return null; }
      target.conversationId = arg;
    }
    if (cmd === '/yes') {
      target.approval = target.approval === 'never' ? 'ask' : 'never';
      target.conversationId = app.conversationId;
    }
    return target;
  }
}

module.exports = SessionCommands;
