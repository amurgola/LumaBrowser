import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import HfRepoUrl from './HfRepoUrl.js';
import ImageModal from './ImageModal.js';
import ImportModelMarkup from './ImportModelMarkup.js';

export default class ImportModelModal extends ImageModal {
  constructor(panel) {
    super();
    this._panel = panel;
  }

  open() {
    if (this.isOpen()) return;
    this.show(ImportModelMarkup.HTML);
    this._pickedFile = null;
    this._tab = 'url';
    this._profilesByBase = {};
    this._bindElements();
    this.wrap.querySelectorAll('button[data-tab]').forEach((b) => b.addEventListener('click', () => this._setTab(b.dataset.tab)));
    this._base.addEventListener('change', () => this._syncBase());
    this._syncBase();
    this._loadProfiles();
    this.wrap.querySelector('[data-act="pick-file"]').addEventListener('click', () => this._pickFile());
    this._submit.addEventListener('click', () => this._onSubmit());
  }

  _bindElements() {
    const q = (s) => this.wrap.querySelector(s);
    this._base = q('#impBase');
    this._qwenNote = q('#impQwenNote');
    this._animaNote = q('#impAnimaNote');
    this._styleRow = q('#impStyleRow');
    this._styleNote = q('#impStyleNote');
    this._styleSelect = q('#impStyle');
    this._submit = q('[data-act="submit"]');
  }

  _setTab(tab) {
    this._tab = tab;
    this.wrap.querySelectorAll('[data-tab]').forEach((el) => {
      if (el.tagName === 'BUTTON') el.classList.toggle('active', el.dataset.tab === tab);
      else el.hidden = el.dataset.tab !== tab;
    });
    this.setError('');
  }

  _syncBase() {
    if (this._qwenNote) this._qwenNote.hidden = this._base.value !== 'qwen-image-edit';
    if (this._animaNote) this._animaNote.hidden = this._base.value !== 'anima';
    this._populateStyles();
  }

  _populateStyles() {
    const list = (this._profilesByBase && this._profilesByBase[this._base.value]) || [];
    const has = list.length > 0;
    if (this._styleRow) this._styleRow.hidden = !has;
    if (this._styleNote) this._styleNote.hidden = !has;
    if (this._styleSelect) {
      const esc = HtmlEscaper.escape;
      this._styleSelect.innerHTML = list.map((p) => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('');
    }
  }

  async _loadProfiles() {
    try {
      const api = this._panel.api();
      if (!api.getPromptProfiles) return;
      const result = await api.getPromptProfiles();
      if (result && result.success) { this._profilesByBase = result.byBase || {}; this._populateStyles(); }
    } catch (_) {}
  }

  async _pickFile() {
    this.setError('');
    try {
      const result = await this._panel.api().pickImportFile();
      if (result && result.success && !result.canceled) {
        this._pickedFile = { filePath: result.filePath, bytes: result.bytes || 0 };
        const display = this.wrap.querySelector('.img-file-name');
        display.textContent = `${result.filePath.split(/[\\/]/).pop()} (${ByteFormatter.bytes(result.bytes || 0)})`;
        display.title = result.filePath;
      } else if (result && !result.success) {
        this.setError(result.error || 'Could not open file picker.');
      }
    } catch (err) { this.setError(err.message); }
  }

  async _onSubmit() {
    this.setError('');
    const form = this._readForm();
    if (!form.name && !form.isRepo) { this.setError('Display name is required.'); return; }
    this._submit.disabled = true;
    this._submit.textContent = 'Starting…';
    this._panel.store.downloadError = null;
    try {
      const result = await this._request(form);
      if (result === null) return;
      if (result && result.success === false && !result.canceled) { this._fail(result.error || 'Import failed.'); return; }
      this.close();
    } catch (err) {
      this._fail(err.message || 'Import request failed.');
    }
  }

  _readForm() {
    const url = this._tab === 'url' ? this.wrap.querySelector('#impUrl').value.trim() : '';
    return {
      name: this.wrap.querySelector('#impName').value.trim(),
      baseType: this._base.value,
      loaderFlag: undefined,
      promptStyle: (this._styleRow && !this._styleRow.hidden && this._styleSelect) ? (this._styleSelect.value || undefined) : undefined,
      url,
      isRepo: HfRepoUrl.isRepoUrl(url),
    };
  }

  async _request(form) {
    const api = this._panel.api();
    const { name, baseType, loaderFlag, promptStyle } = form;
    if (this._tab === 'url') {
      if (!form.url) { this._fail('A download URL is required.'); return null; }
      if (form.isRepo) return api.importModelFromRepo({ url: form.url });
      return api.importModelFromUrl({ name, url: form.url, baseType, loaderFlag, promptStyle });
    }
    if (!this._pickedFile) { this._fail('Pick a local file first.'); return null; }
    return api.importModelFromFile({ name, filePath: this._pickedFile.filePath, baseType, loaderFlag, promptStyle });
  }

  _fail(message) {
    this.setError(message);
    ImageModal.resetButton(this._submit, 'Import');
  }
}
