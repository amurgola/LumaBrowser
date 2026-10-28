import RegionMaskData from './RegionMaskData.js';
import RegionPainter from './RegionPainter.js';
import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RegionEditor {
  static PREVIEW_WIDTH = 320;
  static NOTE_PLACEHOLDER = 'What should change here? e.g. "make the hat red", "remove this person"';
  static HINT = 'Paint over the part to change. Slightly larger than the object works best; the rest of the picture is kept as it is. '
    + 'Edit now sends the note straight away; Add to message keeps it in the composer so you can write more first.';
  static MAX_NOTE_CHARS = 400;

  static supported() {
    try {
      return !!document.createElement('canvas').getContext('2d');
    } catch (_) {
      return false;
    }
  }

  open({ dataUrl, title, existing = null }) {
    if (this._root) this._finish(null);
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._existing = existing;
      this._build(title);
      this._loadImage(dataUrl);
    });
  }

  isOpen() {
    return !!this._root;
  }

  _build(title) {
    const esc = HtmlEscaper.escape;
    this._root = Dom.el('div', 'cm-region-overlay');
    this._root.innerHTML = ''
      + '<div class="cm-region-dialog" role="dialog" aria-modal="true" aria-label="Mark an area to edit">'
      + '  <div class="cm-region-head">'
      + '    <span class="cm-region-ic">' + ChatIcons.brush + '</span>'
      + '    <span class="cm-region-title">Mark the area to edit' + (title ? ' · ' + esc(title) : '') + '</span>'
      + '    <button class="cm-ap-btn" type="button" data-region-cancel title="Close (Esc)">' + ChatIcons.x + '</button>'
      + '  </div>'
      + '  <div class="cm-region-stage-wrap"><div class="cm-region-stage"><img alt=""><canvas data-region-canvas></canvas></div>'
      + '    <div class="cm-region-loading">Loading image…</div></div>'
      + '  <div class="cm-region-tools">'
      + '    <button class="luma-btn luma-btn--sm is-active" type="button" data-region-tool="brush">Brush</button>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-tool="eraser">Eraser</button>'
      + '    <label class="cm-region-size">Size <input type="range" min="' + RegionPainter.MIN_SIZE + '" max="' + RegionPainter.MAX_SIZE + '" data-region-size></label>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-undo disabled>Undo</button>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-clear>Clear</button>'
      + '    <span class="cm-region-coverage" data-region-coverage></span>'
      + '  </div>'
      + '  <input class="cm-region-note" type="text" maxlength="' + RegionEditor.MAX_NOTE_CHARS + '" placeholder="' + esc(RegionEditor.NOTE_PLACEHOLDER) + '" data-region-note>'
      + '  <div class="cm-region-hint">' + RegionEditor.HINT + '</div>'
      + '  <div class="cm-region-foot">'
      + '    <button class="luma-btn" type="button" data-region-cancel>Cancel</button>'
      + '    <button class="luma-btn" type="button" data-region-use disabled title="Stage the area in the composer and keep writing">Add to message</button>'
      + '    <button class="luma-btn luma-btn--primary" type="button" data-region-send disabled title="Send the area and its note now (Enter)">Edit now</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(this._root);
    this._wireChrome();
  }

  _wireChrome() {
    const root = this._root;
    root.querySelectorAll('[data-region-cancel]').forEach((b) => b.addEventListener('click', () => this._finish(null)));
    root.addEventListener('click', (e) => { if (e.target === root) this._finish(null); });
    this._onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this._finish(null); }
    };
    document.addEventListener('keydown', this._onKey);
    const note = root.querySelector('[data-region-note]');
    if (this._existing && this._existing.note) note.value = this._existing.note;
    note.addEventListener('input', () => this._refresh());
    note.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this._enter(); } });
    root.querySelector('[data-region-use]').addEventListener('click', () => this._use());
    root.querySelector('[data-region-send]').addEventListener('click', () => this._send());
  }

  _loadImage(dataUrl) {
    const img = this._root.querySelector('.cm-region-stage img');
    img.addEventListener('load', () => this._ready(img), { once: true });
    img.addEventListener('error', () => this._fail(), { once: true });
    img.src = dataUrl;
  }

  _fail() {
    if (!this._root) return;
    this._root.querySelector('.cm-region-loading').textContent = 'The image could not be loaded.';
  }

  _ready(img) {
    if (!this._root) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) { this._fail(); return; }
    this._root.querySelector('.cm-region-loading').hidden = true;
    this._image = img;
    this._painter = new RegionPainter({ canvas: this._root.querySelector('[data-region-canvas]'), width, height });
    this._wireTools();
    this._wirePainting();
    if (this._existing && this._existing.mask) this._loadExisting();
    this._refresh();
    this._root.querySelector('[data-region-note]').focus();
  }

  _loadExisting() {
    const mask = new Image();
    mask.addEventListener('load', () => { if (this._painter) { this._painter.loadMask(mask); this._refresh(); } }, { once: true });
    mask.src = this._existing.mask.startsWith('data:') ? this._existing.mask : 'data:image/png;base64,' + this._existing.mask;
  }

  _wireTools() {
    const root = this._root;
    root.querySelectorAll('[data-region-tool]').forEach((b) => b.addEventListener('click', () => {
      this._painter.setTool(b.dataset.regionTool);
      root.querySelectorAll('[data-region-tool]').forEach((o) => o.classList.toggle('is-active', o === b));
    }));
    const size = root.querySelector('[data-region-size]');
    size.value = String(this._painter.size);
    size.addEventListener('input', () => this._painter.setSize(size.value));
    root.querySelector('[data-region-undo]').addEventListener('click', () => { this._painter.undo(); this._refresh(); });
    root.querySelector('[data-region-clear]').addEventListener('click', () => { this._painter.clear(); this._refresh(); });
  }

  _wirePainting() {
    const canvas = this._root.querySelector('[data-region-canvas]');
    canvas.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      this._painter.begin(this._painter.pointToImage(e));
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      this._painter.move(this._painter.pointToImage(e));
    });
    const stop = () => { this._painter.end(); this._refresh(); };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('pointerleave', () => this._painter.end());
  }

  _refresh() {
    if (!this._root || !this._painter) return;
    const coverage = this._painter.coverage();
    const blank = coverage === 0;
    this._root.querySelector('[data-region-undo]').disabled = !this._painter.canUndo;
    const use = this._root.querySelector('[data-region-use]');
    use.disabled = blank && !this._existing;
    use.textContent = blank && this._existing ? 'Remove area' : 'Add to message';
    this._root.querySelector('[data-region-send]').disabled = blank || !this._note();
    this._root.querySelector('[data-region-coverage]').textContent = blank ? 'Nothing marked yet' : Math.max(1, Math.round(coverage * 100)) + '% of the image';
  }

  _note() {
    return this._root ? this._root.querySelector('[data-region-note]').value.replace(/\s+/g, ' ').trim() : '';
  }

  _enter() {
    if (this._painter && !this._painter.isBlank() && this._note()) this._send();
    else this._use();
  }

  _use() {
    if (!this._painter) return;
    if (this._painter.isBlank()) { this._finish(this._existing ? { removed: true } : null); return; }
    this._finish(this._result());
  }

  _send() {
    if (!this._painter || this._painter.isBlank() || !this._note()) return;
    this._finish({ ...this._result(), send: true });
  }

  _result() {
    const data = this._painter.imageData();
    return {
      mask: RegionEditor._maskBase64(data),
      note: this._note(),
      coverage: RegionMaskData.coverage(data),
      width: this._painter.width,
      height: this._painter.height,
      preview: this._preview(),
    };
  }

  static _maskBase64(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    const mask = ctx.createImageData(imageData.width, imageData.height);
    mask.data.set(RegionMaskData.maskPixels(imageData));
    ctx.putImageData(mask, 0, 0);
    const url = canvas.toDataURL('image/png');
    return url.slice(url.indexOf(',') + 1);
  }

  _preview() {
    const scale = Math.min(1, RegionEditor.PREVIEW_WIDTH / this._painter.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(this._painter.width * scale));
    canvas.height = Math.max(1, Math.round(this._painter.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this._image, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(this._root.querySelector('[data-region-canvas]'), 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  _finish(result) {
    const resolve = this._resolve;
    if (this._onKey) document.removeEventListener('keydown', this._onKey);
    if (this._root) this._root.remove();
    this._root = null;
    this._painter = null;
    this._image = null;
    this._resolve = null;
    this._onKey = null;
    if (resolve) resolve(result);
  }
}
