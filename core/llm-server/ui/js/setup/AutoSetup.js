import AutoSetupProgress from './AutoSetupProgress.js';
import ImageRuntimePicker from './ImageRuntimePicker.js';
import ImageSetup from './ImageSetup.js';
import LlmSetup from './LlmSetup.js';
import MusicSetup from './MusicSetup.js';
import RamPin from './RamPin.js';
import SetupPipeline from './SetupPipeline.js';
import SystemLibraries from './SystemLibraries.js';

export default class AutoSetup extends SetupPipeline {
  static FAILURE_MESSAGE = 'Automatic setup failed';

  static LEG_ORDER = ['llm', 'image', 'music'];

  static run(apis, opts) {
    return new AutoSetup(apis, opts).run();
  }

  constructor(apis, opts) {
    super(opts);
    this._apis = apis || {};
    this._plan = this._opts.plan;
    this._resumeIndex = Math.max(0, AutoSetup.LEG_ORDER.indexOf(this._opts.resumeFrom));
    this._progress = null;
  }

  _validate() {
    if (!this._apis.llm || !this._plan || !this._plan.llm) return { ok: false, message: 'No automatic setup plan available.' };
    return null;
  }

  async _execute() {
    this._progress = new AutoSetupProgress(this._countedLegs(), this._hooks);
    const blocked = await this._checkSystem();
    if (blocked) return blocked;
    if (this._hooks.isCanceled()) return this._canceled();
    await this._applySingularityLayout();
    const llm = await this._llmLeg();
    if (!llm.ok) return llm;
    if (this._hooks.isCanceled()) return this._canceled();
    const image = await this._imageLeg();
    if (image && image.canceled) return image;
    const music = await this._musicLeg();
    if (music && music.canceled) return music;
    return { ok: true, file: llm.file, destPath: llm.destPath, image, music };
  }

  _countedLegs() {
    const plan = this._plan;
    const legs = [{ key: 'llm', label: 'chat model', bytes: Number(plan.llm.approxBytes) || 0 }];
    if (plan.image && this._apis.image && !plan.image.found) legs.push({ key: 'image', label: 'image model', bytes: Number(plan.image.approxTotalBytes) || 0 });
    if (plan.music && this._apis.music) legs.push({ key: 'music', label: 'music model', bytes: Number(plan.music.approxTotalBytes) || 0 });
    return legs;
  }

  async _checkSystem() {
    this._progress.phase('Checking your system…');
    this._progress.setBar(null, '');
    const sys = await SystemLibraries.problem(this._apis.system || this._apis.llm);
    if (!sys) return null;
    return { ok: false, sysdeps: sys, failedStep: 'system', message: sys.message || 'Some system libraries are missing.' };
  }

  async _applySingularityLayout() {
    const placementPlan = this._plan.placement;
    const placement = this._apis.placement;
    if (!(placementPlan && placementPlan.kind === 'singularity' && placementPlan.layout && placement && placement.setConfig)) return;
    this._progress.phase('Configuring model placement…');
    this._progress.setBar(null, '');
    try { await placement.setConfig({ layout: placementPlan.layout }); } catch (_) {}
  }

  async _llmLeg() {
    const llm = this._apis.llm;
    this._progress.beginLeg('llm');
    if (this._resumeIndex > 0) {
      this._progress.endLeg();
      return { ok: true, file: this._opts.priorFile || '', destPath: null };
    }
    const result = await LlmSetup.run(llm, { rec: this._plan.llm, ...this._progress.pipelineHooks() });
    if (!result.ok) return result.canceled ? result : { ...result, failedStep: 'llm' };
    this._progress.endLeg();
    try { if (llm.setEnabled) await llm.setEnabled(true); } catch (_) {}
    try { if (llm.setOpenTabOnLoad) await llm.setOpenTabOnLoad(true); } catch (_) {}
    return result;
  }

  async _imageLeg() {
    const image = this._apis.image;
    if (!(this._plan.image && image && this._resumeIndex <= AutoSetup.LEG_ORDER.indexOf('image'))) return null;
    this._progress.beginLeg('image');
    const { runtime, model, found } = await this._imageChoice(image);
    let result;
    if ((model || found) && runtime) {
      result = await ImageSetup.run(image, { runtime, model, found, ...this._progress.pipelineHooks() });
      if (!result.ok && result.canceled) return result;
      if (result.ok) await this._rewarmChatAfterImage();
    } else {
      result = { ok: false, message: 'Image model or runtime unavailable on this host.' };
    }
    this._progress.endLeg();
    return result;
  }

  async _imageChoice(image) {
    let view = null;
    let models = [];
    try {
      const rv = await image.getRuntimesView();
      view = (rv && rv.view) || null;
      const catalog = await image.modelCatalog();
      models = (catalog && catalog.models) || [];
    } catch (_) {}
    const found = this._plan.image.found || null;
    const model = found ? null : (models.find((m) => m && m.id === this._plan.image.modelId) || null);
    return { runtime: view ? ImageRuntimePicker.pick(view) : null, model, found };
  }

  async _rewarmChatAfterImage() {
    if (!(this._plan.placement && this._plan.placement.kind === 'singularity')) return;
    const llm = this._apis.llm;
    if (this._plan.ramPin && this._plan.ramPin.recommended) {
      this._progress.phase('Keeping both models in system memory for fast swaps…');
      this._progress.setBar(null, '');
      await RamPin.enable(llm, this._apis.image);
    }
    this._progress.phase('Reloading your chat model…');
    this._progress.setBar(null, '');
    try { await llm.startServer(); } catch (_) {}
  }

  async _musicLeg() {
    if (!(this._plan.music && this._apis.music)) return null;
    this._progress.beginLeg('music');
    const result = await MusicSetup.run(this._apis.music, { plan: this._plan.music, ...this._progress.pipelineHooks() });
    if (!result.ok && result.canceled) return result;
    this._progress.endLeg();
    return result;
  }
}
