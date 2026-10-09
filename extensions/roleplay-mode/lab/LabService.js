const path = require('path');
const ImageProfiles = require('../images/ImageProfiles');
const LabScenario = require('./LabScenario');
const LabSetupRunner = require('./LabSetupRunner');
const LabIntegratedScene = require('./LabIntegratedScene');
const LabTurn = require('./LabTurn');
const LabRunReport = require('./LabRunReport');

class LabService {
  static NOT_REGISTERED = 'Roleplay mode is not registered (is the roleplay extension enabled?).';

  constructor({ mode = null, generateImage = async () => null, Harness = null, imageDefaults, chatStore, broadcast, outRoot } = {}) {
    this._mode = mode;
    this._generateImage = generateImage;
    this._Harness = Harness;
    this._scenario = new LabScenario({ imageDefaults, chatStore });
    this.broadcast = typeof broadcast === 'function' ? broadcast : () => {};
    this._outRoot = outRoot || path.join(process.cwd(), 'tests', 'e2e', '_out', 'rp-lab');
    this._lastSteps = [];
    this._lastFullOpts = {};
    this._lastOutDir = null;
  }

  getScenario() {
    return this._scenario.current();
  }

  getImageProfiles() {
    return JSON.parse(JSON.stringify(ImageProfiles.PROFILES));
  }

  async run({ overrides = {}, options = {} } = {}) {
    return this._invoke({ overrides, frozen: {}, options });
  }

  async regenerateFrom({ fromKey, overrides = {}, options = {} } = {}) {
    if (!fromKey || !this._lastSteps.length) return this.run({ overrides, options });
    const cut = this._lastSteps.map((s) => s.key).indexOf(fromKey);
    const frozen = {};
    for (let i = 0; i < cut; i += 1) {
      const step = this._lastSteps[i];
      const b64 = LabRunReport.readStepB64(this._lastOutDir, step);
      if (b64) frozen[step.key] = { b64, mime: step.mime || 'image/png' };
    }
    return this._invoke({ overrides, frozen, options });
  }

  async regenerateStep({ stepKey, overrides = {} } = {}) {
    const base = this._lastFullOpts[stepKey];
    if (!base) return { success: false, error: 'Run the pipeline first: no saved inputs for "' + stepKey + '".' };
    const merged = LabService._stepOpts(base, (overrides && overrides[stepKey]) || {}, stepKey);
    const outDir = this._lastOutDir || path.join(this._outRoot, LabRunReport.stamp());
    const harness = new this._Harness({ outDir, emit: (t, p) => this._send(t, p) });
    const err = await this._underHarness(harness, () => this._generateImage(merged));
    const step = harness.steps.length ? harness.steps[harness.steps.length - 1] : null;
    if (step) this._replaceStep(stepKey, step, merged);
    return { success: !err, error: err, stepKey, step };
  }

  static _stepOpts(base, ov, stepKey) {
    const merged = Object.assign({}, base, ov);
    if (ov.seed == null) merged.seed = null;
    merged.label = String(stepKey).replace(/#\d+$/, '');
    return merged;
  }

  _replaceStep(stepKey, step, merged) {
    step.key = stepKey;
    const i = this._lastSteps.findIndex((x) => x.key === stepKey);
    if (i >= 0) this._lastSteps[i] = step; else this._lastSteps.push(step);
    this._lastFullOpts[stepKey] = merged;
  }

  async _invoke({ overrides, frozen, options }) {
    if (!this._mode || typeof this._mode.postProcess !== 'function') return { success: false, error: LabService.NOT_REGISTERED };
    const outDir = path.join(this._outRoot, LabRunReport.stamp());
    const run = this._prepareRun(options);
    const harness = new this._Harness({ outDir, emit: run.emit, overrides, frozen, completeMocks: run.turn.canned });
    const err = await this._underHarness(harness, () => this._phases(run, options));
    this._lastSteps = harness.steps.slice();
    this._lastFullOpts = Object.assign({}, harness.fullOpts);
    this._lastOutDir = outDir;
    LabRunReport.write(outDir, harness.steps, { overrides, error: err });
    return {
      success: !err,
      error: err,
      outDir,
      steps: harness.steps,
      comparison: options && options.integratedCompare ? { composite: run.compositeFinal, integrated: run.integratedFinal } : null,
      scenario: { characters: run.meta.data.characters, scenes: run.meta.data.scenes, activeSceneId: run.meta.data.activeSceneId },
    };
  }

  _prepareRun(options) {
    const working = this.getScenario();
    if (options && typeof options === 'object') working.options = Object.assign({}, working.options, options);
    LabService._applyEmotion(working, options);
    const run = { turn: LabTurn.build(working, options), meta: { mode: 'roleplay', data: working }, compositeFinal: null, integratedFinal: null };
    run.setMeta = async (patch) => { if (patch && patch.data) run.meta.data = patch.data; };
    run.emit = (type, payload) => {
      if (type === 'mode:image' && payload && payload.b64) run.compositeFinal = { b64: payload.b64, mime: payload.mime || 'image/png' };
      this._send(type, payload);
    };
    return run;
  }

  static _applyEmotion(working, options) {
    const emo = options && options.emotion ? String(options.emotion).trim().toLowerCase() : '';
    if (!emo || emo === 'neutral') return;
    const st = working.currentState && working.currentState.characters && working.currentState.characters[0];
    if (st) st.emotion = emo;
    const ch = working.characters && working.characters[0];
    if (ch && ch.art && ch.art[emo]) delete ch.art[emo];
  }

  async _phases(run, options) {
    await new LabSetupRunner(this._generateImage).run(run.meta.data);
    await this._mode.postProcess({
      content: run.turn.content,
      conversationId: 'rp-lab', assistantMessageId: 'rp-lab-msg',
      meta: run.meta, emit: run.emit, setMeta: run.setMeta,
    });
    if (!(options && options.integratedCompare)) return;
    run.integratedFinal = await new LabIntegratedScene(this._generateImage).run(run.meta.data, run.turn.shot);
    if (run.compositeFinal || run.integratedFinal) {
      run.emit('lab:comparison', { composite: run.compositeFinal, integrated: run.integratedFinal });
    }
  }

  async _underHarness(harness, fn) {
    this._Harness.install(harness);
    try {
      await fn();
      return null;
    } catch (e) {
      return (e && e.message) || String(e);
    } finally {
      this._Harness.uninstall();
    }
  }

  _send(type, payload) {
    try { this.broadcast(type, payload); } catch (_) {}
  }
}

module.exports = LabService;
