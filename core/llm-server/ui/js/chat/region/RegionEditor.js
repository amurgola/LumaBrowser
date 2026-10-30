import RegionContextBox from './RegionContextBox.js';
import RegionMaskData from './RegionMaskData.js';
import RegionOverlay from './RegionOverlay.js';
import RegionPainter from './RegionPainter.js';
import RegionViewport from './RegionViewport.js';
import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RegionEditor {
  static PREVIEW_WIDTH = 320;
  static NOTE_PLACEHOLDER = 'What should change here? e.g. "make the hat red", "remove this person"';
  static HINT = 'Paint over the part to change, a little larger than the object; the dashed box is the close-up the model '
    + 'works on. Wheel zooms, Space-drag pans, [ and ] (or Alt+wheel) change the brush, B E R F pick a tool. '
    + 'Edit now sends the note straight away; Add to message keeps it in the composer so you can write more first.';
  static MAX_NOTE_CHARS = 400;
  static TOOL_KEYS = { b: 'brush', e: 'eraser', r: 'rect', f: 'fill' };
  static TOOL_LABELS = { brush: 'Brush', eraser: 'Eraser', rect: 'Rectangle', fill: 'Fill' };
  static TOOL_TITLES = { brush: 'Brush (B)', eraser: 'Eraser (E)', rect: 'Rectangle (R)', fill: 'Fill an outlined pocket (F)' };

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
    const tools = RegionPainter.TOOLS.map((t) => '<button class="luma-btn luma-btn--sm' + (t === 'brush' ? ' is-active' : '') + '" type="button" data-region-tool="' + t + '" title="' + esc(RegionEditor.TOOL_TITLES[t]) + '">' + esc(RegionEditor.TOOL_LABELS[t]) + '</button>').join('');
    this._root = Dom.el('div', 'cm-region-overlay');
    this._root.innerHTML = ''
      + '<div class="cm-region-dialog" role="dialog" aria-modal="true" aria-label="Mark an area to edit">'
      + '  <div class="cm-region-head">'
      + '    <span class="cm-region-ic">' + ChatIcons.brush + '</span>'
      + '    <span class="cm-region-title">Mark the area to edit' + (title ? ' · ' + esc(title) : '') + '</span>'
      + '    <button class="cm-ap-btn" type="button" data-region-cancel title="Close (Esc)">' + ChatIcons.x + '</button>'
      + '  </div>'
      + '  <div class="cm-region-view" data-region-view data-tool="brush" tabindex="-1">'
      + '    <div class="cm-region-stage"><img alt=""><canvas data-region-canvas></canvas></div>'
      + '    <canvas class="cm-region-guide" data-region-guide></canvas>'
      + '    <div class="cm-region-loading">Loading image…</div>'
      + '  </div>'
      + '  <div class="cm-region-tools">'
      + tools
      + '    <label class="cm-region-size">Size <input type="range" min="' + RegionPainter.MIN_SIZE + '" max="' + RegionPainter.MAX_SIZE + '" data-region-size>'
      + '      <span class="cm-region-size-label" data-region-size-label></span></label>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-undo disabled title="Undo (Ctrl+Z)">Undo</button>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-invert title="Swap the marked and unmarked parts (I)">Invert</button>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-clear>Clear</button>'
      + '    <button class="luma-btn luma-btn--sm" type="button" data-region-fit hidden title="Show the whole image (0)"></button>'
      + '    <span class="cm-region-coverage" data-region-coverage></span>'
      + '  </div>'
      + '  <div class="cm-region-context" data-region-context></div>'
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
    this._onKey = (e) => this._key(e);
    this._onKeyUp = (e) => { if (e.key === ' ') this._setSpace(false); };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKeyUp);
    const note = root.querySelector('[data-region-note]');
    if (this._existing && this._existing.note) note.value = this._existing.note;
    note.addEventListener('input', () => this._refresh());
    note.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this._enter(); } });
    root.querySelector('[data-region-use]').addEventListener('click', () => this._use());
    root.querySelector('[data-region-send]').addEventListener('click', () => this._send());
  }

  _key(e) {
    if (e.key === 'Escape') { e.preventDefault(); this._finish(null); return; }
    if (!this._painter || e.target === this._root.querySelector('[data-region-note]')) return;
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); this._painter.undo(); this._refresh(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ') { e.preventDefault(); this._setSpace(true); return; }
    if (e.key === '[' || e.key === ']') { e.preventDefault(); this._nudge(e.key === ']' ? 1 : -1); return; }
    if (RegionEditor.TOOL_KEYS[key]) { e.preventDefault(); this._pickTool(RegionEditor.TOOL_KEYS[key]); return; }
    if (key === 'i') { e.preventDefault(); this._painter.invert(); this._refresh(); return; }
    if (e.key === '0') { e.preventDefault(); this._viewport.fit(); this._viewChanged(); }
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
    const view = this._root.querySelector('[data-region-view]');
    this._viewport = new RegionViewport({ viewport: view, stage: this._root.querySelector('.cm-region-stage'), width, height });
    this._overlay = new RegionOverlay({ canvas: this._root.querySelector('[data-region-guide]') });
    this._pointer = null;
    this._pan = null;
    this._rectStart = null;
    this._space = false;
    this._wireTools();
    this._wirePainting(view);
    this._watchSize(view);
    if (this._existing && this._existing.mask) this._loadExisting();
    this._viewChanged();
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
    root.querySelectorAll('[data-region-tool]').forEach((b) => b.addEventListener('click', () => this._pickTool(b.dataset.regionTool)));
    const size = root.querySelector('[data-region-size]');
    size.value = String(this._painter.size);
    size.addEventListener('input', () => { this._painter.setSize(size.value); this._sizeChanged(); });
    root.querySelector('[data-region-undo]').addEventListener('click', () => { this._painter.undo(); this._refresh(); });
    root.querySelector('[data-region-invert]').addEventListener('click', () => { this._painter.invert(); this._refresh(); });
    root.querySelector('[data-region-clear]').addEventListener('click', () => { this._painter.clear(); this._refresh(); });
    root.querySelector('[data-region-fit]').addEventListener('click', () => { this._viewport.fit(); this._viewChanged(); });
    this._sizeChanged();
  }

  _pickTool(tool) {
    this._painter.setTool(tool);
    this._root.querySelectorAll('[data-region-tool]').forEach((o) => o.classList.toggle('is-active', o.dataset.regionTool === tool));
    this._root.querySelector('[data-region-view]').dataset.tool = tool;
    this._root.querySelector('.cm-region-size').classList.toggle('is-idle', !this._painter.sized);
    this._drawGuide();
  }

  _nudge(direction) {
    this._painter.nudgeSize(direction);
    this._root.querySelector('[data-region-size]').value = String(this._painter.size);
    this._sizeChanged();
  }

  _sizeChanged() {
    this._root.querySelector('[data-region-size-label]').textContent = this._painter.size + ' px';
    this._drawGuide();
  }

  _wirePainting(view) {
    view.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1) return;
      e.preventDefault();
      view.focus({ preventScroll: true });
      try { view.setPointerCapture(e.pointerId); } catch (_) {}
      this._pointer = this._viewPoint(e);
      if (e.button === 1 || this._space) { this._pan = { x: e.clientX, y: e.clientY }; view.classList.add('is-panning'); return; }
      const point = this._painter.pointToImage(e);
      const tool = this._painter.tool;
      if (tool === 'rect') this._rectStart = point;
      else if (tool === 'fill') { this._painter.fill(point); this._refresh(); }
      else this._painter.begin(point);
    });
    view.addEventListener('pointermove', (e) => {
      this._pointer = this._viewPoint(e);
      if (this._pan) {
        this._viewport.panBy(e.clientX - this._pan.x, e.clientY - this._pan.y);
        this._pan = { x: e.clientX, y: e.clientY };
        this._viewChanged();
        return;
      }
      if (e.buttons === 0 && e.pointerType === 'mouse') { this._painter.end(); this._drawGuide(); return; }
      if (this._rectStart) { this._drawGuide(); return; }
      this._painter.move(this._painter.pointToImage(e));
      this._drawGuide();
    });
    const stop = (e) => {
      if (this._pan) { this._pan = null; view.classList.remove('is-panning'); return; }
      if (this._rectStart) {
        const start = this._rectStart;
        this._rectStart = null;
        if (e && typeof e.clientX === 'number') this._painter.rect(start, this._painter.pointToImage(e));
      }
      this._painter.end();
      this._refresh();
    };
    view.addEventListener('pointerup', stop);
    view.addEventListener('pointercancel', stop);
    view.addEventListener('pointerleave', () => { this._pointer = null; this._painter.end(); this._drawGuide(); });
    view.addEventListener('wheel', (e) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      if (e.altKey) { this._nudge(dir); return; }
      const p = this._viewPoint(e);
      this._pointer = p;
      if (this._viewport.zoomAt(dir > 0 ? RegionViewport.WHEEL_STEP : 1 / RegionViewport.WHEEL_STEP, p.x, p.y)) this._viewChanged();
    }, { passive: false });
  }

  _watchSize(view) {
    const relayout = () => { if (this._viewport) { this._viewport.layout(); this._viewChanged(); } };
    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(relayout);
      this._resizeObserver.observe(view);
    } else {
      this._onResize = relayout;
      window.addEventListener('resize', this._onResize);
    }
  }

  _setSpace(down) {
    if (!this._root) return;
    this._space = down;
    this._root.querySelector('[data-region-view]').classList.toggle('can-pan', down);
  }

  _viewPoint(e) {
    const rect = this._root.querySelector('[data-region-view]').getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _viewChanged() {
    if (!this._root || !this._viewport) return;
    const view = this._root.querySelector('[data-region-view]');
    this._overlay.resize(view.clientWidth, view.clientHeight);
    const fit = this._root.querySelector('[data-region-fit]');
    fit.hidden = this._viewport.zoom <= RegionViewport.MIN_ZOOM;
    fit.textContent = 'Fit · ' + Math.round(this._viewport.zoom * 100) + '%';
    this._drawGuide();
  }

  _drawGuide() {
    if (!this._overlay || !this._viewport || !this._painter) return;
    const scale = this._viewport.scale;
    const p = this._pointer;
    const cursor = p && this._painter.sized && !this._pan
      ? { x: p.x, y: p.y, radius: (this._painter.size / 2) * scale, eraser: this._painter.tool === 'eraser' }
      : null;
    let rect = null;
    if (this._rectStart && p) {
      const from = this._viewport.toViewport(this._rectStart);
      rect = { x: from.x, y: from.y, width: p.x - from.x, height: p.y - from.y };
    }
    const context = this._context && this._context.cropped ? this._viewport.rectToViewport(this._context.rect) : null;
    this._overlay.draw({ cursor, rect, context });
  }

  _refresh() {
    if (!this._root || !this._painter) return;
    const { coverage, bounds } = this._painter.measure();
    const blank = coverage === 0;
    this._root.querySelector('[data-region-undo]').disabled = !this._painter.canUndo;
    const use = this._root.querySelector('[data-region-use]');
    use.disabled = blank && !this._existing;
    use.textContent = blank && this._existing ? 'Remove area' : 'Add to message';
    this._root.querySelector('[data-region-send]').disabled = blank || !this._note();
    this._root.querySelector('[data-region-coverage]').textContent = blank ? 'Nothing marked yet' : Math.max(1, Math.round(coverage * 100)) + '% of the image';
    this._context = RegionContextBox.resolve({ bounds, width: this._painter.width, height: this._painter.height });
    this._root.querySelector('[data-region-context]').textContent = RegionEditor.contextText(this._context);
    this._drawGuide();
  }

  static contextText(context) {
    const text = RegionContextBox.describe(context);
    return context && context.cropped ? text + ' (the dashed box)' : text;
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
      coverage: this._painter.coverage(),
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
    if (this._onKeyUp) document.removeEventListener('keyup', this._onKeyUp);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this._root) this._root.remove();
    this._root = null;
    this._painter = null;
    this._viewport = null;
    this._overlay = null;
    this._image = null;
    this._context = null;
    this._resolve = null;
    this._onKey = null;
    this._onKeyUp = null;
    this._onResize = null;
    this._resizeObserver = null;
    if (resolve) resolve(result);
  }
}
