const SystemDiagnostics = require('../SystemDiagnostics');
const HardwareSummary = require('../HardwareSummary');
const LlmModelsScanner = require('../LlmModelsScanner');
const LlmRuntimeDetector = require('../runtimes/LlmRuntimeDetector');
const ServerLauncher = require('../server/ServerLauncher');
const FitTester = require('../server/FitTester');
const UnsupportedFlagMemory = require('../server/UnsupportedFlagMemory');
const CudaPin = require('../../shared/runtime/CudaPin');
const FitRuntimePicker = require('./FitRuntimePicker');
const FitTestLive = require('./FitTestLive');

class FitTestSession {
  static ALREADY_RUNNING = 'A fit test is already running.';
  static NO_MODEL_PATH = 'modelPath is required.';
  static MODEL_GONE = 'Model path no longer matches a scanned model.';
  static NO_RUNTIME = 'No installed llama.cpp runtime can run this test. Install llama.cpp (CUDA/Vulkan/CPU); runtimes that cannot accept --flash-attn are excluded.';

  constructor({
    llmServerService, gather = SystemDiagnostics.gather, detector = LlmRuntimeDetector.shared,
    scanner = LlmModelsScanner.shared, launcher = ServerLauncher.shared, fitTester = FitTester.shared,
    resolveCudaDevice = CudaPin.resolveCudaDevice, log = console,
  }) {
    this._svc = llmServerService;
    this._gather = gather;
    this._detector = detector;
    this._scanner = scanner;
    this._launcher = launcher;
    this._fitTester = fitTester;
    this._resolveCudaDevice = resolveCudaDevice;
    this._log = log;
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
    this._restoreAfter = false;
  }

  get running() {
    return this._running;
  }

  async run({ modelPath } = {}, send) {
    if (this._running) return { success: false, error: FitTestSession.ALREADY_RUNNING };
    if (!modelPath) return { success: false, error: FitTestSession.NO_MODEL_PATH };
    const sink = this._liveSink(send);
    this._begin(modelPath);
    try {
      return await this._execute(modelPath, sink);
    } catch (err) {
      sink('error', { message: err.message });
      return { success: false, error: err.message };
    } finally {
      await this._restoreChatServer(sink);
      this._end();
    }
  }

  cancel() {
    if (!this._running) return { running: false };
    this._cancelRequested = true;
    return { running: true };
  }

  status() {
    if (this._running && this._live) return { running: true, live: this._live };
    return { running: false, live: null };
  }

  async _execute(modelPath, sink) {
    const diag = await this._gather({ savedNvidiaSmiPath: this._svc.getSavedNvidiaSmiPath() });
    const hardware = HardwareSummary.summarize(diag) || null;
    this._live.hardware = hardware;
    const runtimesView = await this._detectRuntimes(diag);
    const model = await this._resolveModel(modelPath);
    if (!model) return { success: false, error: FitTestSession.MODEL_GONE };
    const runtime = UnsupportedFlagMemory.withLearnedFlags(FitRuntimePicker.pick(model, runtimesView, diag), this._svc.settingsDb);
    if (!runtime) return { success: false, error: FitTestSession.NO_RUNTIME };
    await this._stopChatServer(sink);
    const runtimeRef = { id: runtime.id, name: runtime.name };
    this._live.runtime = runtimeRef;
    sink('resolved', { runtime: runtimeRef, model: { name: model.name, path: modelPath }, hardware });
    const out = await this._measure(model, runtime, diag, modelPath, sink);
    const ranAt = this._save(modelPath, runtimeRef, out, hardware);
    sink(out.canceled ? 'canceled' : 'done', { runtime: runtimeRef, results: out.results, hardware, ranAt });
    return { success: true, canceled: out.canceled, results: out.results, runtime: runtimeRef, hardware, ranAt };
  }

  _liveSink(send) {
    return (type, payload) => {
      if (type === 'chat-server' && this._live) this._live.noteChatServer(payload);
      send(type, payload);
    };
  }

  _begin(modelPath) {
    this._running = true;
    this._cancelRequested = false;
    this._restoreAfter = false;
    this._live = new FitTestLive(modelPath);
  }

  _end() {
    this._running = false;
    this._cancelRequested = false;
    this._live = null;
  }

  async _resolveModel(modelPath) {
    const scan = await this._scanner.scan(this._svc.getModelsDirConfig().effectivePath);
    return (scan.models || []).find((m) => m.weights && m.weights[0] && m.weights[0].path === modelPath) || null;
  }

  _detectRuntimes(diag) {
    return this._detector.detectRuntimes({
      runtimesRoot: this._svc.getRuntimesDir(),
      cuda: diag.cuda,
      gpu: diag.gpu,
      manualBinaries: this._svc.getAllManualRuntimeBinaries(),
    });
  }

  async _stopChatServer(sink) {
    const state = this._svc.runtimeServer.getStatus().state;
    if (state !== 'ready' && state !== 'starting') return;
    this._restoreAfter = true;
    sink('chat-server', { state: 'stopping' });
    try { await this._svc.runtimeServer.stop(); } catch (_) {}
  }

  _measure(model, runtime, diag, modelPath, sink) {
    const auth = this._svc.getApiKeyForLaunch();
    return this._fitTester.run({
      model,
      runtime,
      diagnostics: diag,
      resolveDevice: (requiredBytes) => this._deviceFor(diag, requiredBytes),
      priorFit: this._svc.getFitResults(modelPath),
      apiKey: auth.required ? auth.key : null,
      onProgress: (msg) => {
        if (this._live) this._live.apply(msg);
        sink('progress', msg);
      },
      shouldCancel: () => this._cancelRequested,
    });
  }

  _deviceFor(diag, requiredBytes) {
    try {
      return this._resolveCudaDevice(this._svc.settingsDb, 'llm', { diagnostics: diag, requiredBytes });
    } catch (_) {
      return null;
    }
  }

  _save(modelPath, runtimeRef, out, hardware) {
    try {
      const saved = this._svc.saveFitResults(modelPath, { runtime: runtimeRef, results: out.results, hardware, canceled: out.canceled });
      return saved && saved.ranAt;
    } catch (e) {
      this._log.warn('[llm-server] saveFitResults failed:', e && e.message);
      return null;
    }
  }

  async _restoreChatServer(sink) {
    if (!this._restoreAfter) return;
    sink('chat-server', { state: 'restarting' });
    try {
      const r = await this._launcher.resolveAndStart(this._svc);
      sink('chat-server', r && r.success ? { state: 'restarted' } : { state: 'restore-failed', error: r && r.error });
    } catch (err) {
      sink('chat-server', { state: 'restore-failed', error: err.message });
    }
  }
}

module.exports = FitTestSession;
