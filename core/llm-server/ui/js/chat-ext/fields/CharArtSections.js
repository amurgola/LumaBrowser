import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import QuickPrompt from '../QuickPrompt.js';
import ImageGenerator from '../ImageGenerator.js';
import CharArtPrompts from './CharArtPrompts.js';

export default class CharArtSections {
  static FULL_BODY = 'fullBody';

  constructor({ art, field, siblingModel, onGenerate }) {
    const all = Array.isArray(field.derivatives) ? field.derivatives : [];
    this.coreEmotions = all.filter((d) => d.key !== CharArtSections.FULL_BODY);
    this._fullBody = all.find((d) => d.key === CharArtSections.FULL_BODY);
    this._art = art;
    this._sibling = siblingModel;
    this._onGenerate = onGenerate;
    this.root = Dom.el('div');
  }

  draw() {
    this.root.innerHTML = '';
    this.root.appendChild(this._emotionsSection());
    this.root.appendChild(this._bodySection());
    this.root.appendChild(this._outfitsSection());
  }

  coreCell(index) {
    return this.root.querySelectorAll('.cm-charart-grid .cm-charart-cell')[index];
  }

  _emotionsSection() {
    const section = CharArtSections._section('Emotions');
    if (!this._hasBase()) return CharArtSections._locked(section, 'Generate or upload the main portrait before creating emotion variants.');
    const grid = Dom.el('div', 'cm-charart-grid');
    this.coreEmotions.forEach((d) => this._addCell(grid, d));
    this._extraEmotions().forEach((item, idx) => this._addCell(grid, CharArtSections._emotionDerivative(item, idx),
      () => this._extraEmotions().splice(idx, 1)));
    section.appendChild(grid);
    section.appendChild(this._addButton('+ Add emotion', 'Emotion name (e.g. nervous, surprised, embarrassed)', (name) => {
      this._extraEmotions().push({ id: 'emotion_' + Date.now().toString(36), name: String(name).trim(), b64: null, mime: 'image/png' });
    }));
    return section;
  }

  _bodySection() {
    const section = CharArtSections._section('Full Body');
    if (!this._hasCoreEmotions()) return CharArtSections._locked(section, 'Generate the initial emotion set before creating the full-body reference.');
    if (this._fullBody) {
      const grid = Dom.el('div', 'cm-charart-grid');
      this._addCell(grid, this._fullBody);
      section.appendChild(grid);
    }
    return section;
  }

  _outfitsSection() {
    const section = CharArtSections._section('Outfits');
    if (!this._hasFullBody()) return CharArtSections._locked(section, 'Generate the full-body reference before adding outfit variants.');
    const grid = Dom.el('div', 'cm-charart-grid');
    this._outfits().forEach((item, idx) => this._addCell(grid, CharArtSections._outfitDerivative(item, idx),
      () => this._outfits().splice(idx, 1)));
    section.appendChild(grid);
    section.appendChild(this._addButton('+ Add outfit', 'Describe the outfit', (desc) => {
      const clean = String(desc).trim();
      this._outfits().push({ id: 'outfit_' + Date.now().toString(36), name: clean.split(',')[0].slice(0, 28) || 'Outfit', desc: clean, b64: null, mime: 'image/png' });
    }));
    return section;
  }

  _addCell(grid, d, onDelete) {
    const cell = Dom.el('div', 'cm-charart-cell');
    const tall = d.key === CharArtSections.FULL_BODY || d.outfitRef;
    const img = Dom.el('img', tall ? 'cm-charart-thumb tall' : 'cm-charart-thumb');
    const data = d.customEmotion || d.outfitRef ? d.item : this._art[d.key];
    if (data && data.b64) img.src = ImageGenerator.dataUri(data);
    const caption = Dom.el('div', 'cm-charart-cap', HtmlEscaper.escape(d.label || d.key));
    const regen = Dom.el('button', 'cm-charart-re', 'Regen');
    regen.type = 'button';
    regen.title = 'Regenerate ' + (d.label || d.key);
    regen.addEventListener('click', () => this._onGenerate(d, cell, regen));
    if (onDelete) cell.appendChild(this._deleteButton(onDelete));
    cell.appendChild(img);
    cell.appendChild(caption);
    cell.appendChild(regen);
    grid.appendChild(cell);
  }

  _deleteButton(onDelete) {
    const del = Dom.el('button', 'cm-charart-re cm-charart-del', '×');
    del.type = 'button';
    del.title = 'Remove';
    del.addEventListener('click', () => { onDelete(); this.draw(); });
    return del;
  }

  _addButton(label, question, add) {
    const button = Dom.el('button', 'luma-btn', label);
    button.type = 'button';
    button.addEventListener('click', async () => {
      const answer = await QuickPrompt.open(question);
      if (!answer) return;
      add(answer);
      this.draw();
    });
    return button;
  }

  _hasBase() {
    return !!(this._art.base && this._art.base.b64);
  }

  _hasCoreEmotions() {
    return this.coreEmotions.length > 0 && this.coreEmotions.every((d) => this._art[d.key] && this._art[d.key].b64);
  }

  _hasFullBody() {
    return !!(this._art.fullBody && this._art.fullBody.b64);
  }

  _extraEmotions() {
    this._art.extraEmotions = Array.isArray(this._art.extraEmotions) ? this._art.extraEmotions : [];
    return this._art.extraEmotions;
  }

  _outfits() {
    if (!this._sibling) return [];
    this._sibling.outfits = Array.isArray(this._sibling.outfits) ? this._sibling.outfits : [];
    return this._sibling.outfits;
  }

  static _emotionDerivative(item, idx) {
    return {
      key: item.id || item.name || ('emotion_' + idx),
      label: item.name || 'Emotion',
      prompt: item.prompt || CharArtPrompts.customEmotion(item.name),
      width: 512, height: 512, subject: false, customEmotion: true, item,
    };
  }

  static _outfitDerivative(item, idx) {
    return {
      key: item.id || ('outfit_' + idx),
      label: item.name || item.desc || 'Outfit',
      prompt: CharArtPrompts.outfit(item),
      width: 768, height: 1152, snapNative: false, outfitRef: true, item,
    };
  }

  static _section(title) {
    const section = Dom.el('div', 'cm-charart-sec');
    section.appendChild(Dom.el('div', 'cm-charart-sec-head', '<span class="cm-charart-sec-title">' + title + '</span>'));
    return section;
  }

  static _locked(section, text) {
    section.appendChild(Dom.el('div', 'cm-charart-lock', text));
    return section;
  }
}
