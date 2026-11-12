const fs = require('fs');
const path = require('path');
const LabRouter = require('./LabRouter');
const LabServerService = require('./LabServerService');
const LabHelperModel = require('./LabHelperModel');
const LabChat = require('./LabChat');

class TextRunCli {
  static USAGE = [
    'Usage: npm run rp:text -- [options]',
    '',
    '  --base-url <url>     OpenAI-compatible base (default http://127.0.0.1:8317/v1, the app\'s Local API)',
    '  --model <gguf>       launch a llama-server for this model instead (needs an installed runtime)',
    '  --runtime <dir>      runtime folder holding llama-server (default runtimes/llama-cpp-luma)',
    '  --port <n>           port for the launched server (default 8399)',
    '  --ctx <n>            context size for the launched server and the router\'s window (default 16384)',
    '  --gpu-layers <n>     -ngl for the launched server (default 99)',
    '  --server-arg <a>     extra llama-server argument, repeatable',
    '  --device <n>         CUDA_VISIBLE_DEVICES for the launched story server (default: every card, as llama.cpp splits)',
    '  --side-model <gguf>  also launch a helper llama-server for this model and give the story sideModel: helper, so the',
    '                       stage, casting, summary and pressure calls go there (the app\'s Setup > Helper model)',
    '  --side-port <n>      port for the helper server (default 8398)',
    '  --side-device <n>    CUDA_VISIBLE_DEVICES for the helper server (default 1 when a second card exists)',
    '  --side-ctx <n>       the helper server\'s context size (default 8192)',
    '  --effort <level>     the thinking dial\'s global default: off, low, medium, high, xhigh or default (the',
    '                       template\'s own; default). The app\'s Setup default is what a user runs with.',
    '  --turns <n>          play only the first n scripted turns',
    '  --judge              add the critic pass (one more completion; the body scenario adds its physicality judge)',
    '  --scenario <name>    scripted playthrough: harbour (default), body, reveal, wound, jungle or control',
    '  --no-grounding       turn the body grounding notes off (an A/B against the same code)',
    '  --mock-side-calls    canned stage/casting replies; only the narrator runs for real',
    '  --label <name>       folder suffix under tests/e2e/_out/rp-lab',
    '  --out <dir>          output root (default tests/e2e/_out/rp-lab)',
    '  --repo <dir>         load the roleplay mode from another checkout (a before/after against a git worktree)',
    '  --help',
  ].join('\n');
  static EFFORTS = ['off', 'low', 'medium', 'high', 'xhigh', 'default'];

  constructor(repoRoot, deps = {}) {
    this._root = repoRoot;
    this._deps = deps;
    this._log = deps.log || ((line) => process.stdout.write(line + '\n'));
  }

  static parse(argv) {
    const o = { baseUrl: 'http://127.0.0.1:8317/v1', model: '', runtime: 'runtimes/llama-cpp-luma', port: 8399, ctx: 16384, gpuLayers: 99, serverArgs: [], device: '', sideModel: '', sidePort: 8398, sideDevice: '', sideCtx: 8192, effort: 'default', turns: 0, scenario: '', grounding: true, judge: false, mockSideCalls: false, label: '', out: '', repo: '', help: false };
    const list = Array.isArray(argv) ? argv : [];
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      const next = () => { i += 1; return list[i]; };
      if (a === '--help' || a === '-h') o.help = true;
      else if (a === '--base-url') o.baseUrl = String(next() || o.baseUrl);
      else if (a === '--model') o.model = String(next() || '');
      else if (a === '--runtime') o.runtime = String(next() || o.runtime);
      else if (a === '--port') o.port = parseInt(next(), 10) || o.port;
      else if (a === '--ctx') o.ctx = parseInt(next(), 10) || o.ctx;
      else if (a === '--gpu-layers') o.gpuLayers = parseInt(next(), 10);
      else if (a === '--server-arg') o.serverArgs.push(String(next() || ''));
      else if (a === '--device') o.device = String(next() || '');
      else if (a === '--side-model') o.sideModel = String(next() || '');
      else if (a === '--side-port') o.sidePort = parseInt(next(), 10) || o.sidePort;
      else if (a === '--side-device') o.sideDevice = String(next() || '');
      else if (a === '--side-ctx') o.sideCtx = parseInt(next(), 10) || o.sideCtx;
      else if (a === '--effort') o.effort = TextRunCli._effort(next());
      else if (a === '--turns') o.turns = parseInt(next(), 10) || 0;
      else if (a === '--judge') o.judge = true;
      else if (a === '--scenario') o.scenario = String(next() || '');
      else if (a === '--no-grounding') o.grounding = false;
      else if (a === '--mock-side-calls') o.mockSideCalls = true;
      else if (a === '--label') o.label = String(next() || '');
      else if (a === '--out') o.out = String(next() || '');
      else if (a === '--repo') o.repo = String(next() || '');
      else throw new Error('unknown option ' + a + '\n' + TextRunCli.USAGE);
    }
    if (!Number.isFinite(o.gpuLayers)) o.gpuLayers = 99;
    return o;
  }

  static _effort(value) {
    const level = String(value || '').trim().toLowerCase();
    if (!TextRunCli.EFFORTS.includes(level)) throw new Error('--effort takes one of ' + TextRunCli.EFFORTS.join(', ') + '\n' + TextRunCli.USAGE);
    return level;
  }

  static serverArgs(o) {
    return ['-m', o.model, '--port', String(o.port), '--host', '127.0.0.1', '-c', String(o.ctx), '-ngl', String(o.gpuLayers), '--jinja', '-fa', 'on']
      .concat(o.serverArgs.filter(Boolean));
  }

  static sideServerArgs(o) {
    return ['-m', o.sideModel, '--port', String(o.sidePort), '--host', '127.0.0.1', '-c', String(o.sideCtx), '-ngl', '99', '-np', '2', '--jinja', '-fa', 'on'];
  }

  static stem(file) {
    return path.basename(file).replace(/\.gguf$/i, '');
  }

  static modelRef(o) {
    return 'local::' + (o.model ? TextRunCli.stem(o.model) : 'endpoint');
  }

  static serverEnv(device, env = process.env) {
    const out = Object.assign({}, env);
    if (device !== '' && device !== null && device !== undefined) {
      out.CUDA_VISIBLE_DEVICES = String(device);
      if (!out.CUDA_DEVICE_ORDER) out.CUDA_DEVICE_ORDER = 'PCI_BUS_ID';
    }
    return out;
  }

  static endpoint(o) {
    if (o.model) return { host: '127.0.0.1', port: o.port };
    const u = new URL(o.baseUrl);
    return { host: u.hostname, port: Number(u.port) || (u.protocol === 'https:' ? 443 : 80) };
  }

  async execute(argv) {
    const o = TextRunCli.parse(argv);
    if (o.help) { this._log(TextRunCli.USAGE); return null; }
    const d = this._resolveDeps(o.repo ? path.resolve(o.repo) : this._root);
    if (o.repo) this._log('roleplay mode loaded from ' + path.resolve(o.repo));
    const outRoot = o.out ? path.resolve(o.out) : path.join(this._root, 'tests', 'e2e', '_out', 'rp-lab');
    fs.mkdirSync(outRoot, { recursive: true });
    let server = null;
    let side = null;
    let lab = null;
    const logs = { main: path.join(outRoot, 'rp-text-llama-server.log'), side: path.join(outRoot, 'rp-text-helper-server.log') };
    try {
      if (o.model) server = await this._launch(o, d, { model: o.model, args: TextRunCli.serverArgs(o), port: o.port, device: o.device, logPath: logs.main, label: 'story model' });
      let helper = null;
      if (o.sideModel) {
        const sideDevice = o.sideDevice || await TextRunCli.secondCard();
        side = await this._launch(o, d, { model: o.sideModel, args: TextRunCli.sideServerArgs(o), port: o.sidePort, device: sideDevice, logPath: logs.side, label: 'helper model' });
        helper = new LabHelperModel({ stem: TextRunCli.stem(o.sideModel), port: o.sidePort, ctx: o.sideCtx, ready: () => side.alive });
      }
      this._knowledgeBase(o);
      lab = this._router(o, d, helper);
      const where = o.model ? 'http://127.0.0.1:' + o.port + ' (' + path.basename(o.model) + ')' : o.baseUrl;
      this._log('narrating against ' + where + ' through the chat router, thinking ' + o.effort + ', window ' + o.ctx
        + (helper ? ', bookkeeping on ' + helper.ref() + ' at :' + o.sidePort : ''));
      const svc = new d.LabService({ mode: lab.mode, router: lab.router, complete: (opts) => lab.chat.complete(opts), Harness: d.LabHarness, outRoot, contextWindow: (n) => { lab.service.ctxPerSlot = n; } });
      svc.broadcast = (type, p) => this._progress(type, p);
      const tap = TextRunCli.debugTap();
      let result;
      try {
        result = await svc.runText({ options: { turns: o.turns || undefined, scenario: o.scenario || undefined, grounding: o.grounding, judge: o.judge, mockSideCalls: o.mockSideCalls, modelRef: TextRunCli.modelRef(o), sideModel: helper ? 'helper' : undefined } });
      } finally {
        tap.stop();
      }
      result.debug = TextRunCli.debugSummary(tap.events);
      result.servers = { main: TextRunCli.serverStats(server ? logs.main : null), helper: TextRunCli.serverStats(side ? logs.side : null) };
      if (o.label && result.outDir) {
        const labelled = result.outDir + '-' + o.label.replace(/[^a-z0-9_-]+/gi, '-');
        try { fs.renameSync(result.outDir, labelled); result.outDir = labelled; } catch (_) {}
      }
      if (result.outDir) {
        try { fs.writeFileSync(path.join(result.outDir, 'text-run.json'), JSON.stringify(result, null, 2)); } catch (_) {}
      }
      this._log('');
      this._log(TextRunCli.summary(result));
      return result;
    } finally {
      if (lab) lab.close();
      if (side) await side.stop();
      if (server) await server.stop();
    }
  }

  static async secondCard() {
    try {
      const LaunchBenchServer = require(path.join(__dirname, '..', 'perf', 'llm', 'LaunchBenchServer'));
      const cards = Object.keys(await LaunchBenchServer.gpuMemoryMib());
      return cards.length >= 2 ? '1' : '';
    } catch (_) {
      return '';
    }
  }

  static debugTap() {
    const events = [];
    const hadEnv = process.env.LUMA_RP_DEBUG;
    if (!hadEnv) process.env.LUMA_RP_DEBUG = '1';
    const original = console.log;
    console.log = (...args) => {
      const first = args[0];
      if (typeof first === 'string' && first.startsWith('[rp-debug] ')) {
        try { events.push(JSON.parse(first.slice('[rp-debug] '.length))); } catch (_) {}
        return;
      }
      original.apply(console, args);
    };
    return { events, stop: () => { console.log = original; if (!hadEnv) delete process.env.LUMA_RP_DEBUG; } };
  }

  static debugSummary(events) {
    const list = Array.isArray(events) ? events : [];
    const raw = list.filter((e) => e.event === 'post.stage.raw');
    const parsed = list.filter((e) => e.event === 'post.stage.parsed');
    const ms = raw.map((e) => Number(e.ms) || 0);
    const cons = list.filter((e) => e.event === 'post.consolidate.summary' || e.event === 'post.consolidate.fold');
    return {
      stage: { calls: raw.length, ok: parsed.filter((e) => e.ok).length, failed: parsed.filter((e) => !e.ok).length + raw.filter((e) => e.error).length, msAvg: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null },
      consolidate: { calls: cons.length, ok: cons.filter((e) => e.ok).length },
    };
  }

  static serverStats(logPath) {
    if (!logPath) return null;
    let text = '';
    try { text = fs.readFileSync(logPath, 'utf8'); } catch (_) { return null; }
    const prompts = [];
    const totals = [];
    for (const line of text.split(/\r?\n/)) {
      let m = line.match(/prompt eval time =\s+([\d.]+) ms \/\s+(\d+) tokens/);
      if (m) { prompts.push({ ms: Number(m[1]), tokens: Number(m[2]) }); continue; }
      m = line.match(/total time =\s+([\d.]+) ms \/\s+(\d+) tokens/);
      if (m) totals.push({ ms: Number(m[1]), tokens: Number(m[2]) });
    }
    const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
    return {
      requests: totals.length,
      promptTokensAvg: avg(prompts.map((p) => p.tokens)),
      promptTokensTotal: prompts.reduce((a, p) => a + p.tokens, 0),
      promptMsAvg: avg(prompts.map((p) => p.ms)),
      totalMsAvg: avg(totals.map((t) => t.ms)),
      totalMsSum: Math.round(totals.reduce((a, t) => a + t.ms, 0)),
    };
  }

  _router(o, d, helper = null) {
    const chatStore = LabRouter.chatStore();
    const { host, port } = TextRunCli.endpoint(o);
    const service = new LabServerService({ chatStore, host, port, ctx: o.ctx, effort: o.effort, modelStem: TextRunCli.modelRef(o).replace(/^local::/, ''), helperModel: helper });
    const built = LabRouter.build({ service, mode: null, dispatcher: this._deps.dispatcher || null });
    const chat = new LabChat({ router: built.router, Harness: d.LabHarness });
    const mode = d.RoleplayModeDescriptor.build(chat, new d.RoleplayPostProcessor(chat));
    built.registry.register(mode, 'roleplay-mode');
    return { router: built.router, service, chat, mode, close: built.close };
  }

  _knowledgeBase(o) {
    if (!o.grounding || global.__lumaRagService) return;
    const RagService = this._deps.RagService || require(path.join(this._root, 'core/rag/RagService'));
    global.__lumaRagService = new RagService({ dbPath: ':memory:' });
    this._log('body grounding: in-memory knowledge base');
  }

  static summary(result) {
    const r = result || {};
    const lines = [];
    if (r.error) lines.push('Error: ' + r.error);
    if (r.probe) lines.push('Consistency: ' + r.probe.passed + ' of ' + r.probe.total + ' checks');
    for (const c of (r.probe && r.probe.checks) || []) lines.push('  ' + (c.ok ? '[x]' : '[ ]') + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
    if (r.cast) {
      lines.push('Cast:');
      for (const c of r.cast.checks || []) lines.push('  ' + (c.ok ? '[x]' : '[ ]') + ' ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
      for (const p of (r.cast.voice && r.cast.voice.pairs) || []) lines.push('  ' + p.a + ' / ' + p.b + ': voice ' + p.voice + ', dialogue ' + p.dialogue);
    }
    if (r.prose && r.prose.words) {
      lines.push('Prose: slop ' + r.prose.perHundred + ' per hundred words, in band ' + r.prose.inBand + ', tagged ' + r.prose.tagged
        + ', handoff ' + r.prose.handoff + ', words min/avg/max ' + r.prose.words.min + '/' + r.prose.words.avg + '/' + r.prose.words.max);
    }
    if (r.judge && r.judge.scores) {
      lines.push('Judge: ' + Object.entries(r.judge.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.judge.notes) lines.push('  ' + r.judge.notes);
    }
    if (r.physicality && r.physicality.scores) {
      lines.push('Physicality: ' + Object.entries(r.physicality.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.physicality.notes) lines.push('  ' + r.physicality.notes);
      for (const slip of r.physicality.slips || []) lines.push('  slip: ' + slip);
    }
    if (r.context) {
      const c = r.context;
      lines.push('Context (avg tokens per narrator turn): total ' + c.total + ', peak ' + c.peak + ', system ' + c.system + ', history ' + c.history + ', notes ' + c.anchor
        + ', reasoning in history ' + c.think + ', repeated phrases ' + c.duplicateWords);
      lines.push('  layers: ' + Object.entries(c.layers).map(([k, v]) => k + ' ' + v).join(', '));
    }
    if (r.bodyDetail) lines.push('Body detail: ' + r.bodyDetail.perHundred + ' body words per hundred');
    if (r.grounding) {
      lines.push('Grounding: cards on ' + r.grounding.turnsWithCards + ' turns'
        + (r.grounding.expectNone ? (r.grounding.ok ? ' (none expected, none fired)' : ' (NONE EXPECTED, BUT CARDS FIRED)') : ''));
    }
    if (r.reveal && r.reveal.scores) {
      lines.push('Reveal: ' + Object.entries(r.reveal.scores).map(([k, v]) => k + ' ' + v).join(', '));
      if (r.reveal.notes) lines.push('  ' + r.reveal.notes);
      lines.push('  reveals listed: ' + (r.reveal.reveals || []).length + '; recalls matching: ' + (r.reveal.recalls || []).filter((x) => x.matches).length + ' of ' + (r.reveal.recalls || []).length);
      for (const x of r.reveal.retention || []) lines.push('  turn ' + x.turn + ' sees ' + x.kept + ' of ' + x.total + ' earlier reveals (' + x.inHistory + ' still in the raw history, ' + x.memoryOnly + ' only in stored memory)');
    }
    if (r.calls && Object.keys(r.calls).length) {
      lines.push('Calls: ' + Object.entries(r.calls).map(([k, v]) => k + ' ' + v.n + (v.ms ? ' (' + (v.ms / 1000 / v.n).toFixed(1) + ' s avg)' : '')).join('; '));
    }
    if (r.debug && r.debug.stage && r.debug.stage.calls) {
      const st = r.debug.stage;
      lines.push('Stage calls: ' + st.calls + ', parsed ' + st.ok + ', failed ' + st.failed + (st.msAvg != null ? ', ' + (st.msAvg / 1000).toFixed(1) + ' s avg' : ''));
    }
    for (const [name, sv] of Object.entries((r.servers || {}))) {
      if (!sv || !sv.requests) continue;
      lines.push((name === 'main' ? 'Story server' : 'Helper server') + ': ' + sv.requests + ' requests, prompt eval avg ' + sv.promptTokensAvg + ' tokens in ' + (sv.promptMsAvg / 1000).toFixed(1) + ' s, '
        + 'request avg ' + (sv.totalMsAvg / 1000).toFixed(1) + ' s, busy ' + (sv.totalMsSum / 1000).toFixed(0) + ' s in all');
    }
    if (r.outDir) lines.push('Report: ' + r.outDir);
    return lines.join('\n');
  }

  _progress(type, p) {
    if (type !== 'lab:text' || !p) return;
    if (p.phase === 'turn') this._log('turn ' + p.turn + ' of ' + p.of + ': ' + String(p.assistant || '').replace(/\s+/g, ' ').slice(0, 110) + '...');
  }

  async _launch(o, d, { model, args, port, device, logPath, label }) {
    const dir = path.resolve(this._root, o.runtime);
    const bin = ['llama-server.exe', 'llama-server'].map((n) => path.join(dir, n)).find((p) => fs.existsSync(p));
    if (!bin) throw new Error('no llama-server under ' + dir + '; pass --runtime');
    if (!fs.existsSync(model)) throw new Error('model not found: ' + model);
    const server = new d.LaunchBenchServer({ binaryPath: bin, args, env: TextRunCli.serverEnv(device), port, logPath });
    this._log('starting ' + path.basename(bin) + ' for the ' + label + ' ' + path.basename(model) + ' on port ' + port + (device ? ' (CUDA ' + device + ')' : '') + ' (log: ' + logPath + ')');
    const secs = await server.start();
    if (secs == null) { await server.stop(); throw new Error('llama-server for the ' + label + ' did not become healthy; see ' + logPath); }
    this._log(label + ' loaded in ' + secs.toFixed(0) + ' s');
    return server;
  }

  _resolveDeps(codeRoot) {
    const d = this._deps;
    const R = (rel) => require(path.join(codeRoot || this._root, rel));
    return {
      LabService: d.LabService || R('extensions/roleplay-mode/lab/LabService'),
      RoleplayModeDescriptor: d.RoleplayModeDescriptor || R('extensions/roleplay-mode/mode/RoleplayModeDescriptor'),
      RoleplayPostProcessor: d.RoleplayPostProcessor || R('extensions/roleplay-mode/pipeline/RoleplayPostProcessor'),
      LabHarness: d.LabHarness || require(path.join(this._root, 'core/roleplay-lab/LabHarness')),
      LaunchBenchServer: d.LaunchBenchServer || require(path.join(this._root, 'tools/perf/llm/LaunchBenchServer')),
    };
  }
}

module.exports = TextRunCli;
