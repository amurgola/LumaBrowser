const path = require('path');
const AgentArgs = require('./AgentArgs');
const BridgeLink = require('./BridgeLink');
const AppDiscovery = require('./connect/AppDiscovery');
const BridgeConnector = require('./connect/BridgeConnector');
const PlainRenderer = require('./plain/PlainRenderer');
const PlainSession = require('./plain/PlainSession');
const AnsiCodes = require('./plain/AnsiCodes');

class AgentCli {
  static EXIT_UNREACHABLE = 3;

  static HELP = `
luma: talk to a LumaBrowser agent from your terminal

Usage:
  luma                              interactive Code session in the current directory
  luma [prompt]                     start with an instruction, then keep chatting
  luma <agent> [prompt] [flags]     the same, as one of your named agents
  luma --agents                     list agents and their models
  luma docs [topic]                 product docs for agents (local-api, api, tools, remote-access); no app needed
  luma skill install                write the luma skill into ~/.claude/skills and ~/.agents/skills
  luma trace [id|last] [--turn N] [--call N] [--json]   per-call LLM trace of a conversation; no app needed

Flags:
  -p, --print          print mode: one turn, answer to stdout, then exit
  --json               JSONL frames on stdout (implies one turn)
  --resume <id>        continue an existing conversation
  --yes                never ask before mutating tools (this run only)
  --cwd <dir>          work in <dir> instead of the current directory
  --container <name[:/dir]>  work inside a running Docker container (dir defaults to /)
  --prompt-file <file> read the instruction from a file (for long or multi-line prompts in scripts)
  --show-reasoning     show the model's thinking as it streams
  --no-suggest         do not offer a model-written follow-up after each turn
  --plain              line-by-line output instead of the full-screen session
  --no-start           fail instead of launching LumaBrowser when it is not running
  -h, --help           this text

In a session: enter sends · tab takes the suggested follow-up · ctrl+j new line
              ctrl+o shows or hides the model's thinking
              esc stops a turn · ctrl+c clears (twice quits)
              / lists commands (/agents /agent /new /resume /reasoning /yes /id /clear /quit)
Environment:  NO_COLOR, LUMA_CLI_THEME=light|dark, LUMA_CLI_ASCII=1
`;

  static async main(argv) {
    if (argv[0] === 'trace') return require('./trace/TraceCommand').run(argv.slice(1));
    const opts = AgentCli._parse(argv);
    if (!opts) return 1;
    if (opts.help) { process.stdout.write(AgentCli.HELP); return 0; }
    const local = AgentCli._localCommand(opts);
    if (local !== null) return local;
    if (!opts.agent) opts.agent = '.';
    return AgentCli._session(opts);
  }

  static isInteractiveTerminal() {
    return !!(process.stdin.isTTY && process.stdout.isTTY);
  }

  static _parse(argv) {
    try { return AgentArgs.parse(argv); } catch (e) {
      process.stderr.write(`luma: ${e.message}\n${AgentCli.HELP}`);
      return null;
    }
  }

  static _localCommand(opts) {
    if (opts.agent === 'docs') return require('./docs/DocsCommand').run(opts.prompt);
    if (opts.agent === 'skill') return require('./docs/SkillCommand').run(opts.prompt);
    return null;
  }

  static async _session(opts) {
    const r = new PlainRenderer({ mode: AgentCli._mode(opts), showReasoning: opts.showReasoning });
    const ws = await AgentCli._connect(opts, r);
    if (!ws) return AgentCli.EXIT_UNREACHABLE;
    if (AgentCli._fullScreen(opts)) return AgentCli._fullScreenSession(ws, opts);
    return new PlainSession({ ws, renderer: r, opts }).run();
  }

  static _mode(opts) {
    if (opts.json) return 'json';
    return opts.print ? 'print' : 'interactive';
  }

  static _fullScreen(opts) {
    const oneShot = opts.json || opts.print || opts.agents;
    return !oneShot && !opts.plain && AgentCli.isInteractiveTerminal() && process.env.TERM !== 'dumb';
  }

  static async _connect(opts, r) {
    const log = (m) => process.stderr.write(`${r.c(AnsiCodes.dim, m)}\n`);
    try {
      const target = await new AppDiscovery().discover({ autoStart: !opts.noStart, log });
      return await BridgeConnector.open(target);
    } catch (e) {
      process.stderr.write(`luma: ${e.message}\n`);
      return null;
    }
  }

  static _fullScreenSession(ws, opts) {
    const App = require('./tui/session/App');
    const app = new App({
      link: new BridgeLink(ws),
      opts: {
        cwd: path.resolve(opts.cwd || process.cwd()),
        agent: opts.agent === '.' ? null : opts.agent,
        agentIsGuess: opts.agent !== '.',
        resume: opts.resume,
        yes: opts.yes,
        showReasoning: opts.showReasoning,
        suggest: !opts.noSuggest,
        prompt: opts.prompt.join(' ').trim(),
      },
    });
    return app.run();
  }
}

module.exports = AgentCli;
