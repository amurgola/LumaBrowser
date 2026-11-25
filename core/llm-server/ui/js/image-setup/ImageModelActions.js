import Dialogs from '../dialogs/Dialogs.js';
import QuantPicker from './QuantPicker.js';

export default class ImageModelActions {
  constructor(panel) {
    this._panel = panel;
  }

  async handle(row, act, _event, btn) {
    const id = (btn && btn.dataset.id) || (row && row.mlKey);
    if (!id && act !== 'dl-cancel') return;
    if (act === 'dl' || act === 'dl-nc') await this._download(act, id, btn);
    else if (act === 'dl-cancel') await this._cancelDownload();
    else if (act === 'pin') await this._pin(id, btn);
    else if (act === 'move') await this._move(id, btn);
    else if (act === 'loras') this._panel.loraModal.open(id);
    else if (act === 'update-file') await this._updateFile(id, btn);
    else if (act === 'uninstall') await this._uninstall(id, btn);
    else if (act === 'int8-build') await this._buildInt8(id, btn);
    else if (act === 'int8-cancel') await this._cancelInt8(id, btn);
    else if (act === 'int8-remove') await this._removeInt8(id, btn);
  }

  async _download(act, id, btn) {
    const store = this._panel.store;
    const quant = QuantPicker.selected(id);
    if (act === 'dl-nc') {
      const note = (btn && btn.dataset.note) || 'This model has a restrictive license.';
      if (!(await Dialogs.confirm(`${note}\n\nDo you agree to abide by the model's license and want to download it now?`))) return;
    }
    store.downloadError = null;
    if (btn) { btn.disabled = true; btn.textContent = 'Starting…'; }
    try {
      const result = await this._panel.api().downloadModel({ id, quant });
      if (result && result.success === false && !result.canceled) { store.downloadError = result.error || 'Download failed to start.'; this._panel.modelsCard.paint(); }
    } catch (err) {
      store.downloadError = (err && err.message) || 'Download request failed.';
      this._panel.modelsCard.paint();
    }
  }

  async _cancelDownload() {
    try { await this._panel.api().cancelModelDownload(); } catch (_) {}
  }

  async _pin(id, btn) {
    const kind = btn && btn.dataset.kind;
    const patch = kind === 'edit' ? { editModelId: id } : (kind === 'video' ? { videoModelId: id } : { modelId: id });
    try {
      await this._panel.api().setDefaults(patch);
    } finally {
      await this._panel.reload('defaults');
      await this._panel.reload('server');
      this._repaintBoth();
    }
  }

  async _move(id, btn) {
    if (btn) btn.disabled = true;
    try {
      const result = await this._panel.api().setModelKind(id, btn && btn.dataset.to);
      if (result && result.success === false) this._panel.store.downloadError = result.error || 'Move failed.';
    } finally {
      await this._panel.refreshModels();
      await this._panel.reload('defaults');
      this._repaintBoth();
    }
  }

  async _updateFile(id, btn) {
    const role = btn && btn.dataset.role;
    if (!role) return;
    btn.disabled = true;
    btn.textContent = 'Updating…';
    const store = this._panel.store;
    store.downloadError = null;
    try {
      const result = await this._panel.api().updateModelFile({ id, role });
      if (result && result.success === false && !result.canceled) store.downloadError = result.error || 'Update failed.';
    } catch (err) {
      store.downloadError = err.message || 'Update failed.';
    } finally {
      await this._panel.refreshModels();
      await this._panel.reload('server');
      this._panel.modelsCard.paint();
    }
  }

  async _buildInt8(id, btn) {
    if (btn) btn.disabled = true;
    this._panel.store.downloadError = null;
    try {
      const result = await this._panel.api().buildInt8Weights({ id });
      if (result && result.success === false && !result.canceled) this._panel.store.downloadError = result.error || 'Could not build faster weights.';
    } catch (err) {
      this._panel.store.downloadError = (err && err.message) || 'Could not build faster weights.';
    } finally {
      await this._refreshAfterInt8();
    }
  }

  async _cancelInt8(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Stopping…'; }
    try { await this._panel.api().cancelInt8Weights(id); } catch (_) {}
  }

  async _removeInt8(id, btn) {
    if (btn) btn.disabled = true;
    try {
      const result = await this._panel.api().removeInt8Weights(id);
      if (result && result.success === false) this._panel.store.downloadError = result.error || 'Could not remove faster weights.';
    } finally {
      await this._refreshAfterInt8();
    }
  }

  async _refreshAfterInt8() {
    await this._panel.refreshModels();
    await this._panel.reload('server');
    this._panel.modelsCard.paint();
  }

  async _uninstall(id, btn) {
    const model = this._panel.store.findModel(id);
    const label = (model && (model.label || model.id)) || id;
    if (!(await Dialogs.confirm(`Remove ${label}? This deletes the model directory from disk.`))) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Removing…'; }
    try {
      const result = await this._panel.api().removeInstalledModel(id);
      if (result && result.success === false) this._panel.store.downloadError = result.error || 'Remove failed.';
    } finally {
      await this._panel.refreshModels();
      await this._panel.reload('defaults');
      await this._panel.reload('server');
      this._repaintBoth();
    }
  }

  _repaintBoth() {
    this._panel.defaultsCard.paint();
    this._panel.modelsCard.paint();
  }
}
