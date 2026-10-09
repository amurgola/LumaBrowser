import ImportSetup from '../../../../llm-server/ui/js/setup/ImportSetup.js';
import LlmSetup from '../../../../llm-server/ui/js/setup/LlmSetup.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';

export default class LlmLocalRunner {
  static RECOMMEND_CHANNEL = 'core.llmServer.recommendModel';

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async runSetup() {
    const L = this._w.state.llm.local;
    const rec = L.rec;
    if (!rec) return;
    this._begin();
    const r = await LlmSetup.run(WizardApis.llm(), {
      rec,
      advanced: L.advanced,
      isCanceled: () => L.canceled,
      ...ProgressPane.hooks(this._step.pane(), 'llm'),
    });
    if (!r.ok) {
      this._fail(r.canceled ? 'Setup canceled. Your progress is saved. Choose Local AI again to resume.' : (r.message || 'Setup failed'));
      return;
    }
    await this._finish(r.file || '');
  }

  async runImport(found) {
    const L = this._w.state.llm.local;
    if (!found || !found.path) return;
    this._begin();
    const rec = await this.importRecommendation();
    const r = await ImportSetup.run(WizardApis.llmImport(), {
      found,
      runtimeId: rec.runtimeId,
      contextSize: rec.contextSize,
      kvCacheType: rec.kvCacheType,
      isCanceled: () => L.canceled,
      ...ProgressPane.hooks(this._step.pane(), 'llm'),
    });
    if (!r.ok) {
      this._fail(r.canceled ? 'Setup canceled. Pick a model again to retry.' : (r.message || 'Could not use that model.'));
      return;
    }
    await this._finish(r.file || found.file || '');
  }

  async importRecommendation() {
    const L = this._w.state.llm.local;
    if (L.importRec) return L.importRec;
    let r = null;
    try { r = await window.ipcBridge.invoke(LlmLocalRunner.RECOMMEND_CHANNEL, {}); } catch (_) { r = null; }
    const rec = (r && r.success && r.recommendation) || {};
    L.importRec = { runtimeId: rec.runtimeId || null, contextSize: rec.contextSize || null, kvCacheType: rec.kvCacheType || null };
    if (r && r.hardware) L.hw = r.hardware;
    return L.importRec;
  }

  _begin() {
    const L = this._w.state.llm.local;
    L.busy = true;
    L.canceled = false;
    L.error = null;
    L.view = 'progress';
    this._repaint();
  }

  _fail(message) {
    const L = this._w.state.llm.local;
    L.busy = false;
    L.error = message;
    L.view = 'error';
    this._repaint();
  }

  async _finish(file) {
    try { await WizardApis.invoke('core.llmServer.setEnabled', true); } catch (_) {}
    const L = this._w.state.llm.local;
    L.modelName = file.replace(/\.[^.]+$/, '') || 'local-model';
    L.busy = false;
    L.done = true;
    L.view = 'done';
    this._repaint();
  }

  _repaint() {
    this._step.render();
    this._w.renderFooter();
  }
}
