const { EventEmitter } = require('events');
const App = require('../../cli/lib/tui/session/App');
const Terminal = require('../../cli/lib/tui/Terminal');
const Theme = require('../../cli/lib/tui/theme/Theme');
const FakeBridgeLink = require('./FakeBridgeLink');
const ScenarioLink = require('./ScenarioLink');

class CliSessionRecorder {
  static MERGE_MS = 24;
  static SHELL_PROMPT_SGR = '\x1b[38;2;122;162;247m';
  static SHELL_DOLLAR_SGR = '\x1b[38;2;138;149;173m';

  constructor({ scenario, cwd }) {
    this._scenario = scenario;
    this._cwd = cwd;
  }

  async record({ cols, rows }) {
    this._setupStreams(cols, rows);
    await this._typeShellLine();
    const app = this._startSession();
    await this._typePrompt();
    await this._link.turnDone;
    await FakeBridgeLink.sleep(600);
    CliSessionRecorder._silence(app);
    const events = CliSessionRecorder.mergeEvents(this._events);
    return { cols, rows, duration: events[events.length - 1][0], events };
  }

  static mergeEvents(events, windowMs = CliSessionRecorder.MERGE_MS) {
    const merged = [];
    for (const [t, s] of events) {
      const last = merged[merged.length - 1];
      if (last && t - last[0] < windowMs) last[1] += s; else merged.push([t, s]);
    }
    return merged;
  }

  _setupStreams(cols, rows) {
    this._events = [];
    const t0 = Date.now();
    this._rec = (s) => this._events.push([Date.now() - t0, s]);
    this._output = Object.assign(new EventEmitter(), { columns: cols, rows, isTTY: true, write: this._rec });
    this._input = Object.assign(new EventEmitter(), { isTTY: true });
  }

  async _typeShellLine() {
    const s = this._scenario;
    this._rec(`${CliSessionRecorder.SHELL_PROMPT_SGR}${s.ROOT_LABEL}\x1b[0m ${CliSessionRecorder.SHELL_DOLLAR_SGR}$\x1b[0m `);
    await FakeBridgeLink.sleep(700);
    for (const ch of `luma ${s.AGENT.name}`) { this._rec(ch); await FakeBridgeLink.sleep(70); }
    await FakeBridgeLink.sleep(450);
    this._rec('\r\n');
  }

  _startSession() {
    this._link = new ScenarioLink({ scenario: this._scenario, pressApprove: () => this._input.emit('data', 'y') });
    const env = { FORCE_COLOR: '3', LUMA_CLI_THEME: 'dark' };
    const app = new App({
      link: this._link,
      terminal: new Terminal({ input: this._input, output: this._output }),
      theme: Theme.create({ stream: this._output, env }),
      opts: { cwd: this._cwd, agent: this._scenario.AGENT.name, agentIsGuess: false, resume: null, yes: false, showReasoning: false, prompt: '' },
    });
    app.run();
    return app;
  }

  async _typePrompt() {
    await FakeBridgeLink.sleep(1300);
    for (const ch of this._scenario.PROMPT) { this._input.emit('data', ch); await FakeBridgeLink.sleep(34); }
    await FakeBridgeLink.sleep(420);
    this._input.emit('data', '\r');
  }

  static _silence(app) {
    app.closed = true;
  }
}

module.exports = CliSessionRecorder;
