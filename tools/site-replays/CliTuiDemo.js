const App = require('../../cli/lib/tui/session/App');
const CliDemoLink = require('./CliDemoLink');

class CliTuiDemo {
  static AUTO_PROMPT = 'fix the failing test';
  static POLL_MS = 200;
  static QUIT_AFTER_MS = 1600;

  async execute(args, { cwd = process.cwd(), terminal } = {}) {
    const auto = args.includes('--auto');
    this._link = new CliDemoLink({ autoApprove: auto });
    const opts = { cwd, agent: 'reviewer', agentIsGuess: false, resume: null, yes: false, showReasoning: args.includes('--reasoning'), prompt: auto ? CliTuiDemo.AUTO_PROMPT : '' };
    this._app = new App({ link: this._link, opts, terminal });
    const running = this._app.run();
    if (auto) this._quitAfterFirstTurn();
    return running;
  }

  _quitAfterFirstTurn() {
    const check = setInterval(() => {
      if (this._app.streaming || this._link.turns < 1) return;
      clearInterval(check);
      setTimeout(() => this._app.quit(), CliTuiDemo.QUIT_AFTER_MS);
    }, CliTuiDemo.POLL_MS);
  }
}

module.exports = CliTuiDemo;
