const BuildFs = require('../BuildFs');
const path = require('path');
const { spawnSync } = require('child_process');
const BytecodeStub = require('../bytecode/BytecodeStub');
const ExtensionManifests = require('../bytecode/ExtensionManifests');
const RequireScanner = require('../bytecode/RequireScanner');
const SourceClassifier = require('../bytecode/SourceClassifier');
const SourceTree = require('../bytecode/SourceTree');

const fs = BuildFs.get();

class AsarBytecodeVerifier {
  static REGRESSION_ROWS = [
    ['app/AppBootstrap.js', 'stub'],
    ['core/shell/ExtensionManager.js', 'stub'],
    ['core/network-sharing/webapp/WebAppServer.js', 'stub'],
    ['core/shared/runtime/rampin/RamPinService.js', 'stub'],
    ['core/tts-server/TtsServerService.js', 'stub'],
    ['extensions/tool-forge/ForgeService.js', 'stub'],
    ['extensions/tool-forge/sandbox/ToolSandbox.js', 'stub'],
    ['main.js', 'plain'],
    ['preload.js', 'plain'],
    ['webview-preload.js', 'plain'],
    ['mcp-server.js', 'plain'],
    ['core/shell/McpServer.js', 'plain'],
    ['core/shell/mcp-stdio/AppLauncher.js', 'plain'],
    ['core/shell/mcp-stdio/JsonHttpClient.js', 'plain'],
    ['core/shell/mcp-stdio/StdioJsonRpc.js', 'plain'],
    ['core/browser/ChromeObjectShim.js', 'plain'],
    ['core/browser/PasskeyShim.js', 'plain'],
    ['core/browser/tab-preload/TabPreload.js', 'plain'],
    ['core/browser/tab-preload/MainWorldScript.js', 'plain'],
    ['core/browser/tab-preload/NotificationForwarder.js', 'plain'],
    ['core/llm-server/llm-tab-preload.js', 'plain'],
    ['core/llm-server/preload/LlmTabPreloadApi.js', 'plain'],
    ['core/llm-server/preload/PreloadSection.js', 'plain'],
    ['core/shared/ipc/IpcSubscription.js', 'plain'],
    ['core/shared/ipc/VoiceChannels.js', 'plain'],
    ['core/dashboard/dashboard-tab-preload.js', 'plain'],
    ['core/dashboard/preload/DashboardPreloadApi.js', 'plain'],
    ['core/on-demand/on-demand-preload.js', 'plain'],
    ['core/on-demand/preload/OnDemandPreloadApi.js', 'plain'],
    ['core/browser/overlay/overlay-preload.js', 'plain'],
    ['core/browser/overlay/OverlayPreloadApi.js', 'plain'],
    ['core/shell/extension-editor-preload.js', 'plain'],
    ['core/shared/runtime/rampin/RamPinWorker.js', 'plain'],
    ['core/shared/runtime/rampin/RamPinSession.js', 'plain'],
    ['core/shared/runtime/rampin/RamPinMessagePort.js', 'plain'],
    ['core/shared/runtime/rampin/WindowsMemoryLock.js', 'plain'],
    ['core/tts-server/TtsWorker.js', 'plain'],
    ['core/tts-server/worker/TtsWorkerSession.js', 'plain'],
    ['core/tts-server/worker/PocketVoices.js', 'plain'],
    ['core/tts-server/worker/TtsSynthesisRequest.js', 'plain'],
    ['core/tts-server/runtimes/SherpaAddon.js', 'plain'],
    ['core/whisper-server/sherpa/SherpaSttWorker.js', 'plain'],
    ['core/whisper-server/sherpa/SherpaSttWorkerSession.js', 'plain'],
    ['core/shared/audio/WavCodec.js', 'plain'],
    ['core/shared/audio/PcmSamples.js', 'plain'],
    ['core/llm-server/ggufParseWorker.js', 'plain'],
    ['core/adblocker/filterWorker.js', 'plain'],
    ['core/network-sharing/webapp/public/sw.js', 'plain'],
    ['core/llm-server/ui/resonant.js', 'plain'],
    ['ui/shell/entry.js', 'plain'],
    ['extensions/ext-ui.js', 'plain'],
    ['extensions/tool-forge/setup-ui.js', 'plain'],
    ['extensions/tool-forge/sandbox/runner.js', 'plain'],
    ['extensions/tool-forge/sandbox/runner-preload.js', 'plain'],
    ['extensions/game-mode/chat-ui.js', 'plain'],
    ['extensions/game-mode/luma-ai-runtime.js', 'plain'],
    ['extensions/page-change-detector/picker.js', 'plain'],
    ['extensions/tab-share/manifest.js', 'absent'],
    ['extensions/roleplay-mode/manifest.js', 'absent'],
  ];

  constructor({ asarPath, sourceRoot, asar = require('@electron/asar'), nodePath = process.execPath, log = console.log,
    rows = AsarBytecodeVerifier.REGRESSION_ROWS }) {
    this._asarPath = asarPath;
    this._rows = rows;
    this._sourceRoot = sourceRoot;
    this._asar = asar;
    this._nodePath = nodePath;
    this._log = log;
    this._pass = 0;
    this._fail = 0;
    this._shipped = null;
  }

  verify() {
    this._shipped = this._listShipped();
    this._checkClassification();
    this._checkRegressionRows();
    this._checkDistributablesAbsent();
    this._checkMcpServerUnpacked();
    this._checkNativeModulesUnpacked();
    this._log(`\n[verify] ${this._pass} passed, ${this._fail} failed`);
    return { pass: this._pass, fail: this._fail };
  }

  _listShipped() {
    const entries = this._asar.listPackage(this._asarPath).map((p) => p.replace(/\\/g, '/').replace(/^\//, ''));
    return new Set(entries.filter((rel) => rel && this._isFileEntry(rel)));
  }

  _isFileEntry(rel) {
    const stat = this._asar.statFile(this._asarPath, rel.split('/').join(path.sep));
    return Boolean(stat && !stat.files);
  }

  _appFiles() {
    return [...this._shipped].filter((rel) => !rel.startsWith('node_modules/'));
  }

  _checkClassification() {
    this._log('[verify] classification of every shipped .js:');
    const files = this._appFiles().filter((rel) => fs.existsSync(path.join(this._sourceRoot, rel)));
    const manifests = new ExtensionManifests(this._sourceRoot);
    const decisions = new SourceClassifier(new SourceTree(this._sourceRoot, { files }), {
      privateExtensionDirs: manifests.privateDirs(),
      manifestBrowserFiles: manifests.browserFiles(),
    }).classify();
    let mismatches = 0;
    for (const [rel, decision] of decisions) {
      if (!this._classificationHolds(rel, decision)) mismatches++;
    }
    this._record(mismatches === 0, `${decisions.size} shipped .js files match the classifier (${mismatches} mismatches)`);
  }

  _classificationHolds(rel, decision) {
    const isStub = this._isStub(rel);
    const hasJsc = this._shipped.has(BytecodeStub.jscPathFor(rel));
    const ok = decision.compile ? isStub && hasJsc : !isStub;
    if (!ok) this._log(`  [FAIL] ${rel} expected=${decision.compile ? 'stub+jsc' : `plain (${decision.reason})`} stub=${isStub} jsc=${hasJsc}`);
    return ok;
  }

  _checkRegressionRows() {
    this._log('[verify] regression rows:');
    for (const [rel, expected] of this._rows) {
      const actual = !this._shipped.has(rel) ? 'absent' : (this._isStub(rel) ? 'stub' : 'plain');
      this._record(actual === expected, `${rel} expected=${expected} actual=${actual}`);
    }
  }

  _checkDistributablesAbsent() {
    for (const dir of new ExtensionManifests(this._sourceRoot).distributableDirs()) {
      const shipped = [...this._shipped].some((rel) => rel.startsWith(`extensions/${dir}/`));
      this._record(!shipped, `distributable extension "${dir}" is not in app.asar`);
    }
  }

  _checkMcpServerUnpacked() {
    this._log('[verify] asarUnpack round-trip:');
    const tree = new SourceTree(this._sourceRoot, { files: this._appFiles() });
    for (const rel of RequireScanner.closure(tree, ['mcp-server.js'])) {
      const file = this._unpackedPath(rel);
      const present = fs.existsSync(file);
      this._record(present && !BytecodeStub.isStub(fs.readFileSync(file, 'utf8')), `${rel} is plain JS in app.asar.unpacked/`);
    }
    this._probeMcpServerLoads();
  }

  _probeMcpServerLoads() {
    const probe = spawnSync(this._nodePath, ['-e', "require('./core/shell/McpServer.js')"], {
      cwd: `${this._asarPath}.unpacked`,
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: '', ELECTRON_RUN_AS_NODE: '1' },
    });
    this._record(probe.status === 0, 'core/shell/McpServer.js loads under plain Node from app.asar.unpacked/');
    if (probe.status !== 0) this._log(String(probe.stderr).split('\n').slice(0, 6).map((l) => `           ${l}`).join('\n'));
  }

  _checkNativeModulesUnpacked() {
    const natives = [...this._shipped].filter((rel) => rel.endsWith('.node'));
    const packed = natives.filter((rel) => !fs.existsSync(this._unpackedPath(rel)));
    for (const rel of packed) this._log(`  [FAIL] ${rel} is still inside app.asar`);
    this._record(packed.length === 0, `${natives.length - packed.length}/${natives.length} native .node files are in app.asar.unpacked/`);
    if ([...this._shipped].some((rel) => rel.startsWith('node_modules/koffi/'))) {
      this._record(fs.existsSync(this._unpackedPath('node_modules/koffi/package.json')), 'node_modules/koffi is in app.asar.unpacked/');
    }
  }

  _isStub(rel) {
    try {
      return BytecodeStub.isStub(this._asar.extractFile(this._asarPath, rel.split('/').join(path.sep)).toString('utf8'));
    } catch (_) {
      return false;
    }
  }

  _unpackedPath(rel) {
    return path.join(`${this._asarPath}.unpacked`, ...rel.split('/'));
  }

  _record(ok, message) {
    this._log(`  ${ok ? '[OK]  ' : '[FAIL]'} ${message}`);
    if (ok) this._pass++; else this._fail++;
  }
}

module.exports = AsarBytecodeVerifier;
