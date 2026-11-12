const fs = require('fs');
const path = require('path');
const LabRouter = require('./LabRouter');
const TextRunCli = require('./TextRunCli');
const StateProbeRunner = require('./StateProbeRunner');

class StateProbeCli {
  static USAGE = [
    'Usage: npm run rp:state -- [options]',
    '',
    '  --context-only       no model: restore the story and check the request each probe would send',
    '  --model <gguf>       launch a llama-server for this model and run each probe\'s turn on it',
    '  --base-url <url>     use a server that is already up instead (OpenAI-compatible base, e.g. http://127.0.0.1:8317/v1)',
    '  --probe <id>         run only this probe (repeatable); ids are listed with --list',
    '  --list               print the probes and exit',
    '  --repeat <n>         run each probe n times (a model\'s replies vary); default 1',
    '  --ctx <n>            context size for the launched server and the router\'s window (default 16384)',
    '  --effort <level>     thinking dial: off, low, medium, high, xhigh, default (default: default)',
    '  --device <n>         CUDA_VISIBLE_DEVICES for the launched server',
    '  --port <n>           port for the launched server (default 8399)',
    '  --runtime <dir>      runtime folder holding llama-server (default runtimes/llama-cpp-luma)',
    '  --thinking <mode>    narrator thinking for the story: brief (default), off or full',
    '  --log                write a verbose turn log for each probe (the roleplay-logs folder)',
    '  --label <name>       folder suffix under the output root',
    '  --out <dir>          output root (default tests/e2e/_out/rp-lab)',
    '  --help',
  ].join('\n');

  constructor(repoRoot, deps = {}) {
    this._root = repoRoot;
    this._deps = deps;
    this._log = deps.log || ((line) => process.stdout.write(line + '\n'));
  }

  static parse(argv) {
    const o = { contextOnly: false, baseUrl: '', probes: [], list: false, repeat: 1, log: false, thinking: '', label: '', out: '', help: false, server: [] };
    const list = Array.isArray(argv) ? argv : [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const next = () => { i += 1; return list[i]; };
      if (a === '--help' || a === '-h') o.help = true;
      else if (a === '--context-only') o.contextOnly = true;
      else if (a === '--list') o.list = true;
      else if (a === '--log') o.log = true;
      else if (a === '--probe') o.probes.push(String(next() || ''));
      else if (a === '--thinking') o.thinking = String(next() || '');
      else if (a === '--repeat') o.repeat = Math.max(1, parseInt(next(), 10) || 1);
      else if (a === '--label') o.label = String(next() || '');
      else if (a === '--out') o.out = String(next() || '');
      else if (a === '--base-url') { o.baseUrl = String(next() || ''); o.server.push('--base-url', o.baseUrl); }
      else if (['--model', '--ctx', '--effort', '--device', '--port', '--runtime'].includes(a)) o.server.push(a, String(next() || ''));
      else throw new Error('unknown option ' + a + '\n' + StateProbeCli.USAGE);
    }
    o.run = TextRunCli.parse(o.server);
    if (!o.contextOnly && !o.run.model && !o.baseUrl) o.contextOnly = true;
    return o;
  }

  async execute(argv) {
    const o = StateProbeCli.parse(argv);
    if (o.help) { this._log(StateProbeCli.USAGE); return null; }
    const Runner = this._deps.Runner || StateProbeRunner;
    if (o.list) {
      for (const p of new Runner({}).probes) this._log(p.id.padEnd(16) + p.title);
      return null;
    }
    const outRoot = o.out ? path.resolve(o.out) : path.join(this._root, 'tests', 'e2e', '_out', 'rp-lab');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
    const outDir = path.join(outRoot, stamp + '-state' + (o.label ? '-' + o.label.replace(/[^a-z0-9_-]+/gi, '-') : ''));
    fs.mkdirSync(outDir, { recursive: true });
    const cli = new TextRunCli(this._root, { log: this._log });
    let server = null;
    try {
      if (!o.contextOnly && o.run.model) {
        const d = cli._resolveDeps(this._root);
        server = await cli._launch(o.run, d, { model: o.run.model, args: TextRunCli.serverArgs(o.run), port: o.run.port, device: o.run.device, logPath: path.join(outDir, 'llama-server.log'), label: 'story model' });
      }
      const { host, port } = o.contextOnly ? { host: '127.0.0.1', port: 1 } : TextRunCli.endpoint(o.run);
      const runner = new Runner({
        live: o.contextOnly ? null : (this._deps.live || (({ service, db }) => LabRouter.localDispatcher({ service, db }))),
        host, port, ctx: o.run.ctx, effort: o.run.effort,
        modelStem: o.contextOnly ? 'restored-story' : TextRunCli.modelRef(o.run).replace(/^local::/, ''),
        options: Object.assign(o.log ? { verboseLog: true } : {}, o.thinking ? { narratorThinking: o.thinking } : {}),
      });
      this._log(o.contextOnly ? 'context only: no model, checking the request each probe sends'
        : 'running each probe\'s turn on ' + (o.run.model ? path.basename(o.run.model) : o.baseUrl) + ', thinking ' + o.run.effort + ', window ' + o.run.ctx);
      const results = [];
      for (let n = 0; n < o.repeat; n += 1) {
        await runner.runAll({
          ids: o.probes,
          onResult: (r) => {
            if (o.repeat > 1) r.id = r.id + ' #' + (n + 1);
            results.push(r);
            const fails = r.context.concat(r.reply).filter((c) => !c.ok);
            this._log((r.error ? 'ERROR ' : (r.passed ? 'pass  ' : 'FAIL  ')) + r.id.padEnd(18) + (r.error || fails.map((c) => c.name).join('; ') || (r.context.length + r.reply.length) + ' checks') + ' (' + (r.ms / 1000).toFixed(1) + ' s)');
          },
        });
      }
      const summary = StateProbeCli.summary(results);
      fs.writeFileSync(path.join(outDir, 'state-probes.md'), StateProbeRunner.report(results, { lines: [summary] }));
      fs.writeFileSync(path.join(outDir, 'state-probes.json'), JSON.stringify(results, null, 1));
      this._log('');
      this._log(summary);
      this._log('Report: ' + outDir);
      return { results, outDir, failed: results.filter((r) => !r.passed).length };
    } finally {
      if (server) await server.stop();
    }
  }

  static summary(results) {
    const all = results.flatMap((r) => r.context.map((c) => Object.assign({ kind: 'context' }, c)).concat(r.reply.map((c) => Object.assign({ kind: 'reply' }, c))));
    const count = (kind) => { const list = all.filter((c) => c.kind === kind); return list.filter((c) => c.ok).length + ' of ' + list.length; };
    return results.filter((r) => r.passed).length + ' of ' + results.length + ' probes passed; context checks ' + count('context') + ', reply checks ' + count('reply') + '.';
  }
}

module.exports = StateProbeCli;
