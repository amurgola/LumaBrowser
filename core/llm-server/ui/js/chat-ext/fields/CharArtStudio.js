import Dom from '../../dom/Dom.js';
import ImageGenerator from '../ImageGenerator.js';
import FileBase64 from '../FileBase64.js';
import QuickPrompt from '../QuickPrompt.js';
import CharArtPrompts from './CharArtPrompts.js';
import CharArtSections from './CharArtSections.js';

export default class CharArtStudio {
  static VARIATIONS_LABEL = 'Generate variations';
  static HINT_MS = 1800;

  constructor({ field, art, api, siblingModel, rootModel }) {
    this._field = field;
    this._art = art;
    this._api = api;
    this._sibling = siblingModel;
    this._prompts = new CharArtPrompts(field, siblingModel, rootModel);
    this._sections = new CharArtSections({
      art, field, siblingModel, onGenerate: (d, cell, button) => this._generateDerivative(d, cell, button),
    });
  }

  build() {
    const studio = Dom.el('div', 'cm-charart');
    this._errLine = Dom.el('div', 'luma-form-err');
    studio.appendChild(this._baseRow());
    studio.appendChild(this._sections.root);
    this._sections.draw();
    studio.appendChild(this._errLine);
    return studio;
  }

  _baseRow() {
    const row = Dom.el('div', 'cm-charart-base');
    this._baseImg = Dom.el('img', 'cm-charart-img');
    if (this._art.base && this._art.base.b64) this._baseImg.src = ImageGenerator.dataUri(this._art.base);
    const actions = Dom.el('div', 'cm-ximg-actions');
    actions.appendChild(this._button('luma-btn', 'Generate face', (b) => this._generateBase(b)));
    this._appendBaseUpload(actions);
    actions.appendChild(this._button('luma-btn primary', CharArtStudio.VARIATIONS_LABEL, (b) => this._generateVariations(b)));
    row.appendChild(this._baseImg);
    row.appendChild(actions);
    return row;
  }

  _button(cls, label, onClick) {
    const button = Dom.el('button', cls, label);
    button.type = 'button';
    button.addEventListener('click', () => onClick(button));
    return button;
  }

  _appendBaseUpload(actions) {
    const fileInput = Dom.el('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    actions.appendChild(this._button('luma-btn', 'Upload', () => fileInput.click()));
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const read = await FileBase64.read(file);
      if (read) { this._art.base = read; this._baseImg.src = ImageGenerator.dataUri(read); }
    });
    actions.appendChild(fileInput);
  }

  async _generateBase(button) {
    const subject = this._prompts.subject() || await QuickPrompt.open('Describe the character’s appearance');
    if (subject == null) return;
    this._setErr('');
    button.disabled = true;
    button.textContent = 'Generating…';
    const prompt = this._prompts.compose(this._field.baseSuffix || '', { subjectText: subject });
    CharArtStudio._debug('[charart] face prompt:', prompt, '| model:', this._prompts.baseModelRef() || '(default)');
    const res = await ImageGenerator.generate(this._api, {
      prompt, modelRef: this._prompts.baseModelRef(),
      width: this._field.baseWidth || 512, height: this._field.baseHeight || 512,
    });
    button.disabled = false;
    this._applyBase(button, res);
  }

  _applyBase(button, res) {
    if (res && res.b64) {
      this._art.base = { b64: res.b64, mime: res.mime };
      this._baseImg.src = ImageGenerator.dataUri(res);
      button.textContent = 'Regenerate face';
      return;
    }
    button.textContent = this._art.base ? 'Regenerate face' : 'Generate face';
    this._setErr('Face: ' + ((res && res.error) || 'generation failed'));
  }

  async _generateVariations(button) {
    if (!this._art.base || !this._art.base.b64) {
      button.textContent = 'Generate a face first';
      setTimeout(() => { button.textContent = CharArtStudio.VARIATIONS_LABEL; }, CharArtStudio.HINT_MS);
      return;
    }
    button.disabled = true;
    const core = this._sections.coreEmotions;
    for (let i = 0; i < core.length; i++) {
      button.textContent = 'Generating ' + (core[i].label || core[i].key) + '…';
      const cell = this._sections.coreCell(i);
      const regen = cell && cell.querySelector('.cm-charart-re');
      await this._generateDerivative(core[i], cell, regen || button);
    }
    button.disabled = false;
    button.textContent = 'Regenerate variations';
  }

  async _generateDerivative(d, cell, button) {
    if (!this._art.base || !this._art.base.b64) { this._setErr('Generate a face first.'); return; }
    this._setErr('');
    const previous = button.textContent;
    button.disabled = true;
    button.textContent = '…';
    const res = await ImageGenerator.generate(this._api, this._derivativeRequest(d));
    button.disabled = false;
    button.textContent = previous;
    if (res && res.b64) this._applyDerivative(d, cell, res);
    else this._failDerivative(d, cell, res);
  }

  _derivativeRequest(d) {
    const editModel = this._prompts.editModelRef();
    const prompt = this._prompts.compose(d.prompt, { context: d.context === true, subject: d.subject !== false });
    CharArtStudio._debug('[charart] variation prompt:', prompt, '| model:', (editModel || '(default edit slot)'), '| ref:', true);
    const ref = d.outfitRef && this._art.fullBody && this._art.fullBody.b64 ? this._art.fullBody.b64 : this._art.base.b64;
    return {
      prompt,
      modelRef: editModel || undefined,
      slot: 'edit',
      refImages: [ref],
      width: d.width || 512,
      height: d.height || 512,
      ...(d.steps != null ? { steps: d.steps } : {}),
      ...(d.sampler ? { sampler: d.sampler } : {}),
      ...(d.scheduler ? { scheduler: d.scheduler } : {}),
      ...(d.cfgScale != null ? { cfgScale: d.cfgScale } : {}),
      ...(d.strength != null ? { strength: d.strength } : {}),
      ...(d.snapNative != null ? { snapNative: d.snapNative } : {}),
    };
  }

  _applyDerivative(d, cell, res) {
    if (d.customEmotion || d.outfitRef) {
      d.item.b64 = res.b64;
      d.item.mime = res.mime || 'image/png';
      if (d.outfitRef) this._wearFirstOutfit(d.item);
    } else {
      this._art[d.key] = { b64: res.b64, mime: res.mime };
    }
    const img = cell && cell.querySelector('img');
    if (img) img.src = ImageGenerator.dataUri(res);
    if (cell) cell.title = '';
    this._sections.draw();
  }

  _wearFirstOutfit(item) {
    if (!this._sibling || this._sibling.currentOutfit) return;
    this._sibling.currentOutfit = item.id;
    this._sibling.currentOutfitDesc = item.desc || '';
  }

  _failDerivative(d, cell, res) {
    if (cell) cell.title = (res && res.error) || 'failed';
    this._setErr((d.label || d.key) + ': ' + ((res && res.error) || 'generation failed'));
  }

  _setErr(message) {
    this._errLine.textContent = message || '';
  }

  static _debug(...parts) {
    try { console.debug(...parts); } catch (_) {}
  }
}
