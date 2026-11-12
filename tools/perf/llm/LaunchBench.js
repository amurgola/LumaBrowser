const fs = require('fs');
const os = require('os');
const path = require('path');
const LaunchBenchOptions = require('./LaunchBenchOptions');
const LaunchBenchServer = require('./LaunchBenchServer');
const LaunchBenchReport = require('./LaunchBenchReport');
const LaunchBenchSampler = require('./LaunchBenchSampler');

class LaunchBench {
  static DECODE_PROMPTS = [
    'Write a detailed explanation of how a hash map handles collisions, with a short Python example.',
    'Describe the causes of the French Revolution in five paragraphs.',
    'Plan a three day hiking trip in the Dolomites, day by day, with gear advice.',
  ];

  static PROMPT_PARAGRAPH = 'The committee reviewed the quarterly logistics report, noting delays at the northern depot, '
    + 'a rise in fuel costs, and a backlog of maintenance tickets for the refrigerated trucks. ';

  static PROMPT_PARAGRAPHS = 110;

  constructor(repoRoot, deps = {}) {
    this._root = repoRoot;
    this._deps = deps;
    this._log = deps.log || ((line) => process.stdout.write(line + '\n'));
    this._Sampler = deps.Sampler || LaunchBenchSampler;
  }

  async execute(argv) {
    const options = LaunchBenchOptions.parse(argv);
    if (options.help) { this._log(LaunchBenchOptions.USAGE); return null; }
    const outDir = options.outDir ? path.resolve(options.outDir) : path.join(this._root, 'test-data', 'llm-launch-bench', options.label);
    fs.mkdirSync(outDir, { recursive: true });
    const planned = await this._plan(options);
    fs.writeFileSync(path.join(outDir, 'planned.json'), JSON.stringify({ args: planned.args, notes: planned.notes }, null, 1));
    this._log(`planned: ${planned.args.join(' ')}`);
    const results = [];
    for (const variant of options.variants) {
      const result = await this._runVariant(options, planned, variant, outDir);
      results.push(result);
      this._log(LaunchBenchReport.line(result));
      fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
      fs.writeFileSync(path.join(outDir, 'results.md'), LaunchBenchReport.markdown(results, planned));
    }
    return { outDir, results };
  }

  async _plan(options) {
    const d = this._resolveDeps();
    const runtime = this._resolveRuntime(options);
    const model = await this._scanModel(options.model, d.scanner);
    const diagnostics = await this._liveDiagnostics(d, options.pin);
    const overrides = { contextSize: options.contextSize, maxConcurrent: 1, suppressMmprojLoad: true };
    const out = new d.LaunchPlanner().plan({ model, runtime, diagnostics, port: options.port, overrides });
    return { binaryPath: runtime.binaryPath, args: out.args, notes: out.plan.notes };
  }

  _resolveDeps() {
    const R = (p) => require(path.join(this._root, p));
    const d = this._deps;
    return {
      scanner: d.scanner || (R('core/llm-server/LlmModelsScanner').shared || new (R('core/llm-server/LlmModelsScanner'))()),
      LaunchPlanner: d.LaunchPlanner || R('core/llm-server/server/LaunchPlanner'),
      CudaDeviceProbe: d.CudaDeviceProbe || R('core/shared/runtime/CudaDeviceProbe'),
      CudaPin: d.CudaPin || R('core/shared/runtime/CudaPin'),
      NvidiaSmiStream: d.NvidiaSmiStream || R('core/shared/runtime/NvidiaSmiStream'),
    };
  }

  _resolveRuntime(options) {
    if (options.binaryPath) {
      return { id: options.runtimeId, name: options.runtimeId, binaryPath: path.resolve(options.binaryPath), version: options.version };
    }
    const dir = path.join(this._runtimesDir(), options.runtimeId);
    const bin = ['llama-server.exe', 'llama-server'].map((n) => path.join(dir, n)).find((p) => fs.existsSync(p));
    if (!bin) throw new Error(`runtime ${options.runtimeId} has no llama-server under ${dir}; pass --binary and --version`);
    let version = options.version;
    if (!version) {
      try {
        const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
        version = (manifest.release && manifest.release.tag) || manifest.version || null;
      } catch (e) {}
    }
    if (!version) throw new Error(`runtime ${options.runtimeId} has no release tag; pass --version b<N>`);
    return { id: options.runtimeId, name: options.runtimeId, binaryPath: bin, version };
  }

  _runtimesDir() {
    if (this._deps.runtimesDir) return this._deps.runtimesDir;
    if (process.env.LUMA_RUNTIMES_DIR) return process.env.LUMA_RUNTIMES_DIR;
    const base = process.platform === 'win32' && process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, 'LumaBrowser')
      : path.join(os.homedir(), '.config', 'LumaBrowser');
    return path.join(base, 'runtimes');
  }

  async _scanModel(modelPath, scanner) {
    const isFile = fs.existsSync(modelPath) && fs.statSync(modelPath).isFile();
    const folder = isFile ? path.dirname(modelPath) : modelPath;
    const res = await scanner.scan(folder);
    const models = res.models || res;
    const wanted = isFile ? path.resolve(modelPath).toLowerCase() : null;
    const model = models.find((m) => !wanted || (m.weights || []).some((w) => path.resolve(w.path).toLowerCase() === wanted)) || models[0];
    if (!model) throw new Error(`no LLM model found at ${modelPath}`);
    return model;
  }

  async _liveDiagnostics(d, pin) {
    d.NvidiaSmiStream.shared.start();
    await d.CudaDeviceProbe.whenReady(5000);
    const rows = d.NvidiaSmiStream.shared.snapshot().rows;
    const diag = {
      cuda: { available: true, devices: rows.map((r) => ({ name: r.name, memoryTotalMB: Math.round(r.totalBytes / 2 ** 20), memoryFreeMB: Math.round(r.freeBytes / 2 ** 20) })) },
      memory: { totalBytes: os.totalmem(), freeBytes: os.freemem() },
    };
    const live = await d.CudaDeviceProbe.withFreshLiveMemory(diag);
    if (d.NvidiaSmiStream.shared.stop) d.NvidiaSmiStream.shared.stop();
    return pin ? d.CudaPin.filterDiagnosticsToDevices(live, pin) : live;
  }

  async _runVariant(options, planned, variant, outDir) {
    const args = LaunchBenchOptions.applyVariant(planned.args, variant);
    const env = { ...process.env, CUDA_DEVICE_ORDER: 'PCI_BUS_ID', ...(options.pin ? { CUDA_VISIBLE_DEVICES: options.pin } : {}), ...variant.env };
    const server = new LaunchBenchServer({ binaryPath: planned.binaryPath, args, env, port: options.port, logPath: path.join(outDir, `${variant.name}.log`) });
    const result = { variant: variant.name, args, env: { ...(options.pin ? { CUDA_VISIBLE_DEVICES: options.pin } : {}), ...variant.env } };
    const before = await LaunchBenchServer.gpuMemoryMib();
    const sampler = new this._Sampler({ file: path.join(outDir, `${variant.name}.samples.csv`) });
    sampler.start('load');
    try {
      const load = await server.start();
      if (load == null) { result.error = 'did not start'; return result; }
      result.loadSeconds = +load.toFixed(1);
      sampler.mark('warm');
      await this._warmUp(server, options);
      result.vramMib = LaunchBench._delta(await LaunchBenchServer.gpuMemoryMib(), before);
      sampler.mark('decode');
      await this._measureDecode(server, options, result, sampler);
      sampler.mark('prompt');
      await this._measurePrompt(server, options, result);
      result.peakVramMib = LaunchBench._delta(await LaunchBenchServer.gpuMemoryMib(), before);
    } catch (e) {
      result.error = String((e && e.message) || e);
    } finally {
      await server.stop();
      result.cacheStats = server.cacheStatsLines();
      result.samples = await sampler.stop();
    }
    return result;
  }

  async _warmUp(server, options) {
    let left = options.warmTokens;
    for (let i = 0; left > 0; i++) {
      const n = Math.min(left, options.nPredict);
      await server.complete(LaunchBench.DECODE_PROMPTS[i % LaunchBench.DECODE_PROMPTS.length], n, options);
      left -= n;
    }
  }

  async _measureDecode(server, options, result, sampler = null) {
    result.decodeTps = [];
    result.texts = [];
    for (const prompt of LaunchBench.DECODE_PROMPTS) {
      const r = await server.complete(prompt, options.nPredict, options);
      result.decodeTps.push(+r.timings.predicted_per_second.toFixed(2));
      result.texts.push(r.content);
    }
    result.decodeMeanTps = +(result.decodeTps.reduce((a, b) => a + b, 0) / result.decodeTps.length).toFixed(2);
    if (options.longPredict > 0) {
      if (sampler) sampler.mark('long');
      const r = await server.complete(LaunchBench.DECODE_PROMPTS[0], options.longPredict, options);
      result.decodeLongTps = +r.timings.predicted_per_second.toFixed(2);
    }
  }

  async _measurePrompt(server, options, result) {
    const prompt = Array.from({ length: LaunchBench.PROMPT_PARAGRAPHS }, (_, i) => `[${i}] ${LaunchBench.PROMPT_PARAGRAPH}`).join('')
      + '\nSummarize the above in one sentence.';
    const r = await server.complete(prompt, 64, options);
    result.promptTokens = r.timings.prompt_n;
    result.promptTps = +r.timings.prompt_per_second.toFixed(1);
    result.decodeAtDepthTps = +r.timings.predicted_per_second.toFixed(2);
  }

  static _delta(after, before) {
    const out = {};
    for (const k of Object.keys(after)) out[k] = after[k] - (before[k] || 0);
    return out;
  }
}

module.exports = LaunchBench;
