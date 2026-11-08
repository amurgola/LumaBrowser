import ImageModal from '../../image-setup/ImageModal.js';
import DrafterModalMarkup from './DrafterModalMarkup.js';
import LlmModelRow from './LlmModelRow.js';

export default class DrafterModal extends ImageModal {
  constructor(ctx, downloads) {
    super();
    this._ctx = ctx;
    this._downloads = downloads;
    this._model = null;
  }

  open(key) {
    if (this.isOpen()) return false;
    const scan = this._ctx.library && this._ctx.library.scan;
    const model = ((scan && scan.models) || []).find((m) => LlmModelRow.nameKey(m) === key);
    if (!model) return false;
    this._model = model;
    this.show(DrafterModalMarkup.html({
      label: model.displayName || model.name,
      offer: model.drafterOffer || null,
      options: DrafterModalMarkup.options(model, (scan && scan.drafters) || []),
    }));
    this.wrap.querySelector('[data-act="save"]').addEventListener('click', () => this._save());
    const dl = this.wrap.querySelector('[data-act="dl-drafter"]');
    if (dl) dl.addEventListener('click', () => this._download());
    return true;
  }

  _download() {
    const m = this._model;
    const offer = m && m.drafterOffer;
    if (!offer || this._downloads.busy) { this.setError(this._downloads.busy ? 'Another drafter download is running.' : ''); return; }
    this.close();
    this._downloads.start(LlmModelRow.nameKey(m), offer.id, LlmModelRow.weightsPath(m) || '');
  }

  static choiceOf(value) {
    if (value === DrafterModalMarkup.AUTO || !value) return 'auto';
    if (value === DrafterModalMarkup.OFF) return 'off';
    if (value === DrafterModalMarkup.MTP) return 'mtp';
    return { path: value };
  }

  async _save() {
    this.setError('');
    const api = this._ctx.api;
    const button = this.wrap.querySelector('[data-act="save"]');
    if (!api || !api.setModelDrafter) { this.setError('Saving a drafter choice is unavailable.'); return; }
    button.disabled = true;
    button.textContent = 'Saving…';
    try {
      const choice = DrafterModal.choiceOf(this.wrap.querySelector('#drafterSel').value);
      const res = await api.setModelDrafter({ key: LlmModelRow.nameKey(this._model), choice });
      if (!res || res.success === false) { this.setError((res && res.error) || 'Save failed.'); ImageModal.resetButton(button, 'Save'); return; }
      this.close();
      this._ctx.refreshLibrary();
    } catch (err) {
      this.setError(err.message);
      ImageModal.resetButton(button, 'Save');
    }
  }
}
