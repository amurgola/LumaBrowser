const AppDiscovery = require('../connect/AppDiscovery');
const BridgeConnector = require('../connect/BridgeConnector');
const AcpAgent = require('./AcpAgent');
const JsonRpcStdio = require('./JsonRpcStdio');

class AcpCommand {
  static HELP = `
luma acp: serve LumaBrowser as an Agent Client Protocol (ACP) agent over stdio

The editor starts this command and talks JSON-RPC on its stdin and stdout; the
agent answers from the running LumaBrowser (started hidden when it is not).

Register it in JetBrains Air (~/.jetbrains/acp.json), or let Settings > LLM >
Connect your agent > JetBrains Air write the entry:
  { "agent_servers": { "LumaBrowser": { "command": "<luma>", "args": ["acp"] } } }

Flags:
  --agent <name>   answer as one of your named LumaBrowser agents (default: Code)
  --yes, -y        never ask before mutating tools (no permission prompts)
  --no-start       fail instead of launching LumaBrowser when it is not running
  -h, --help       this text
`;

  static defaults() {
    return { agent: null, yes: false, noStart: false, help: false };
  }

  static parse(argv) {
    const o = AcpCommand.defaults();
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--agent') o.agent = argv[++i] || null;
      else if (a === '--yes' || a === '-y') o.yes = true;
      else if (a === '--no-start') o.noStart = true;
      else if (a === '-h' || a === '--help') o.help = true;
      else throw new Error(`unknown argument: ${a}`);
    }
    return o;
  }

  static async run(argv, { stdin = process.stdin, stdout = process.stdout, stderr = process.stderr, connect = null, version = null } = {}) {
    let opts;
    try { opts = AcpCommand.parse(argv); } catch (e) {
      stderr.write(`luma acp: ${e.message}\n${AcpCommand.HELP}`);
      return 1;
    }
    if (opts.help) { stdout.write(AcpCommand.HELP); return 0; }
    const log = (m) => stderr.write(`luma acp: ${m}\n`);
    const rpc = new JsonRpcStdio({ input: stdin, output: stdout });
    const agent = new AcpAgent({
      rpc,
      connect: connect || (() => AcpCommand.connect(opts, log)),
      defaults: { agent: opts.agent, approval: opts.yes ? 'never' : 'ask' },
      version: version || AcpCommand.version(),
      log,
    }).register();
    rpc.on('handler-error', (method, e) => log(`${method}: ${(e && e.message) || e}`));
    const closed = new Promise((resolve) => rpc.on('close', resolve));
    rpc.start();
    await closed;
    agent.closeAll();
    return 0;
  }

  static async connect(opts, log) {
    const target = await new AppDiscovery().discover({ autoStart: !opts.noStart, log });
    return BridgeConnector.open(target);
  }

  static version() {
    try { return require('../../package.json').version || null; } catch (_) { return null; }
  }
}

module.exports = AcpCommand;
