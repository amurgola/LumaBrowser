import ChatIcons from '../../ChatIcons.js';
import Dom from '../../../dom/Dom.js';
import HtmlEscaper from '../../../format/HtmlEscaper.js';
import MediaDetails from './MediaDetails.js';
import MediaGallery from './MediaGallery.js';
import MediaViewport from './MediaViewport.js';
import VideoControls from './VideoControls.js';

export default class MediaViewer {
  static DETAILS_KEY = 'luma.chat.viewerDetails';
  static BACKDROP_KEY = 'luma.chat.viewerBackdrop';
  static WHEEL_PIXELS = 420;
  static CLICK_SLOP = 4;

  constructor(ctx, hooks = {}) {
    this._ctx = ctx;
    this._hooks = hooks;
    this._items = [];
    this._index = 0;
    this._token = 0;
    this._entry = null;
    this._el = null;
    this._viewport = null;
    this._video = new VideoControls();
    this._drag = null;
  }

  element() {
    if (!this._el) this._build();
    return this._el;
  }

  current() {
    return this._items[this._index] || null;
  }

  currentEntry() {
    return this._entry;
  }

  open(artifact) {
    const { items, index } = MediaGallery.around(this._ctx.state, artifact);
    this._items = items;
    this._renderStrip();
    return this.show(index);
  }

  async show(index) {
    if (!this._items.length) return;
    const n = this._items.length;
    this._index = ((index % n) + n) % n;
    const item = this._items[this._index];
    const token = ++this._token;
    this._entry = null;
    this._renderPosition();
    this._renderDetails(item);
    this._markStrip();
    if (!this._ctx.mediaCache.peek(item.artifact.id)) this._message('Loading ' + (item.artifact.type === 'video' ? 'video' : 'image') + '…');
    if (this._hooks.onShow) this._hooks.onShow(item, null);
    const entry = await this._ctx.mediaCache.load(item.artifact.id);
    if (token !== this._token) return;
    if (!entry) { this._message(item.artifact.type === 'video' ? 'Failed to load video.' : 'Failed to load image.'); return; }
    this._entry = entry;
    this._mount(item, entry);
    if (this._hooks.onShow) this._hooks.onShow(item, entry);
    this._preloadNeighbours();
  }

  next() { if (this._items.length > 1) this.show(this._index + 1); }

  prev() { if (this._items.length > 1) this.show(this._index - 1); }

  reset() {
    this._token++;
    this._entry = null;
    this._video.attach(null);
    if (!this._el) return;
    const stage = this._el.querySelector('.cm-mv-stage');
    const media = stage.querySelector('video');
    if (media) { try { media.pause(); } catch (_) {} }
    stage.innerHTML = '';
  }

  focus() {
    if (this._el) { try { this._el.focus({ preventScroll: true }); } catch (_) {} }
  }

  relayout() {
    if (this._viewport) this._viewport.layout();
    this._renderZoom();
  }

  onKey(e) {
    if (!this._el || !this._el.isConnected || MediaViewer._typing(e.target)) return false;
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    const k = e.key;
    const actions = {
      ArrowLeft: () => this.prev(), ArrowRight: () => this.next(),
      '+': () => this._zoomStep(1), '=': () => this._zoomStep(1), '-': () => this._zoomStep(-1), _: () => this._zoomStep(-1),
      0: () => this._fit(), 1: () => this._oneToOne(),
      i: () => this.toggleDetails(), I: () => this.toggleDetails(),
      b: () => this._toggleBackdrop(), B: () => this._toggleBackdrop(),
      ' ': () => this._video.togglePlay(), ',': () => this._video.stepFrame(-1), '.': () => this._video.stepFrame(1),
    };
    const run = actions[k];
    if (!run) return false;
    if ((k === ' ' || k === ',' || k === '.') && !this._isVideo()) return false;
    e.preventDefault();
    run();
    return true;
  }

  toggleDetails() {
    const box = this._el.querySelector('.cm-mv-details');
    const on = box.hidden;
    box.hidden = !on;
    this._el.querySelector('.cm-mv-info').classList.toggle('is-on', on);
    MediaViewer._store(MediaViewer.DETAILS_KEY, on ? '1' : '0');
    requestAnimationFrame(() => this.relayout());
  }

  _build() {
    const el = Dom.el('div', 'cm-mv');
    el.tabIndex = -1;
    el.innerHTML = '<div class="cm-mv-view" data-bg="' + (MediaViewer._load(MediaViewer.BACKDROP_KEY) === 'light' ? 'light' : 'dark') + '">'
      +   '<div class="cm-mv-stage"></div>'
      +   '<div class="cm-mv-msg" hidden></div>'
      +   '<button type="button" class="cm-mv-nav cm-mv-prev" title="Previous (Left)" aria-label="Previous">' + ChatIcons.chevronLeft + '</button>'
      +   '<button type="button" class="cm-mv-nav cm-mv-next" title="Next (Right)" aria-label="Next">' + ChatIcons.chevronRight + '</button>'
      + '</div>'
      + '<div class="cm-mv-bar">'
      +   '<span class="cm-mv-pos" aria-live="polite"></span>'
      +   '<span class="cm-mv-zoom">'
      +     '<button type="button" class="cm-mv-btn cm-mv-out" title="Zoom out (-)" aria-label="Zoom out">' + ChatIcons.minus + '</button>'
      +     '<button type="button" class="cm-mv-pct" title="Fit to panel (0)">100%</button>'
      +     '<button type="button" class="cm-mv-btn cm-mv-in" title="Zoom in (+)" aria-label="Zoom in">' + ChatIcons.plus + '</button>'
      +     '<button type="button" class="cm-mv-txt cm-mv-fit" title="Fit to panel (0)">Fit</button>'
      +     '<button type="button" class="cm-mv-txt cm-mv-one" title="Actual pixels (1)">1:1</button>'
      +   '</span>'
      +   '<span class="cm-mv-spacer"></span>'
      +   '<button type="button" class="cm-mv-btn cm-mv-bg" title="Light or dark backdrop (B)" aria-label="Toggle backdrop">' + ChatIcons.contrast + '</button>'
      +   '<button type="button" class="cm-mv-btn cm-mv-info" title="Details (I)" aria-label="Details">' + ChatIcons.info + '</button>'
      + '</div>'
      + '<div class="cm-mv-details" hidden></div>'
      + '<div class="cm-mv-strip" role="listbox" aria-label="Images and videos in this chat"></div>';
    el.querySelector('.cm-mv-bar').insertBefore(this._video.element, el.querySelector('.cm-mv-spacer'));
    this._el = el;
    this._wireBar();
    this._wireStage();
    if (MediaViewer._load(MediaViewer.DETAILS_KEY) === '1') {
      el.querySelector('.cm-mv-details').hidden = false;
      el.querySelector('.cm-mv-info').classList.add('is-on');
    }
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(() => this.relayout()).observe(el.querySelector('.cm-mv-view'));
    }
  }

  _wireBar() {
    const q = (sel) => this._el.querySelector(sel);
    q('.cm-mv-prev').addEventListener('click', () => this.prev());
    q('.cm-mv-next').addEventListener('click', () => this.next());
    q('.cm-mv-out').addEventListener('click', () => this._zoomStep(-1));
    q('.cm-mv-in').addEventListener('click', () => this._zoomStep(1));
    q('.cm-mv-pct').addEventListener('click', () => this._fit());
    q('.cm-mv-fit').addEventListener('click', () => this._fit());
    q('.cm-mv-one').addEventListener('click', () => this._oneToOne());
    q('.cm-mv-bg').addEventListener('click', () => this._toggleBackdrop());
    q('.cm-mv-info').addEventListener('click', () => this.toggleDetails());
  }

  _wireStage() {
    const view = this._el.querySelector('.cm-mv-view');
    view.addEventListener('wheel', (e) => this._onWheel(e, view), { passive: false });
    view.addEventListener('dblclick', (e) => {
      if (!this._viewport || e.target.closest('.cm-mv-nav')) return;
      const p = MediaViewer._local(e, view);
      this._viewport.toggle(p.x, p.y);
      this._renderZoom();
    });
    view.addEventListener('pointerdown', (e) => this._onDown(e, view));
    view.addEventListener('pointermove', (e) => this._onMove(e));
    view.addEventListener('pointerup', (e) => this._onUp(e, view));
    view.addEventListener('pointercancel', () => { this._drag = null; view.classList.remove('is-panning'); });
  }

  _onWheel(e, view) {
    if (!this._viewport) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 32 : (e.deltaMode === 2 ? 400 : 1);
    const factor = Math.exp((-e.deltaY * unit) / MediaViewer.WHEEL_PIXELS);
    const p = MediaViewer._local(e, view);
    this._viewport.zoomAt(factor, p.x, p.y);
    this._renderZoom();
  }

  _onDown(e, view) {
    if (e.button !== 0 || !this._viewport || e.target.closest('.cm-mv-nav')) return;
    this._drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    try { view.setPointerCapture(e.pointerId); } catch (_) {}
    if (!this._viewport.isFit()) view.classList.add('is-panning');
  }

  _onMove(e) {
    const d = this._drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    this._viewport.panBy(dx, dy);
  }

  _onUp(e, view) {
    const d = this._drag;
    this._drag = null;
    view.classList.remove('is-panning');
    if (!d || d.id !== e.pointerId) return;
    if (d.moved < MediaViewer.CLICK_SLOP && this._isVideo() && e.target.closest('.cm-mv-stage')) this._video.togglePlay();
  }

  _mount(item, entry) {
    const stage = this._el.querySelector('.cm-mv-stage');
    const old = stage.querySelector('video');
    if (old) { try { old.pause(); } catch (_) {} }
    stage.innerHTML = '';
    const isVideo = item.artifact.type === 'video' && !/^image\//i.test(entry.mime || '');
    const media = isVideo ? document.createElement('video') : document.createElement('img');
    media.className = 'cm-mv-media';
    media.draggable = false;
    media.style.visibility = 'hidden';
    if (isVideo) {
      Object.assign(media, { muted: true, loop: true, autoplay: true, playsInline: true });
      media.addEventListener('loadedmetadata', () => this._sized(media, media.videoWidth, media.videoHeight), { once: true });
    } else {
      media.alt = item.artifact.title || '';
      media.addEventListener('load', () => this._sized(media, media.naturalWidth, media.naturalHeight), { once: true });
    }
    media.addEventListener('error', () => this._message(isVideo ? 'Failed to play video.' : 'Failed to load image.'), { once: true });
    media.src = entry.url || entry.dataUrl;
    stage.appendChild(media);
    this._video.attach(isVideo ? media : null, item.artifact.render && item.artifact.render.fps);
    this._el.classList.toggle('is-video', isVideo);
  }

  _sized(media, width, height) {
    if (!media.isConnected) return;
    const view = this._el.querySelector('.cm-mv-view');
    const stage = this._el.querySelector('.cm-mv-stage');
    if (!this._viewport) this._viewport = new MediaViewport({ viewport: view, stage, width: width || 1, height: height || 1 });
    else this._viewport.setSize(width, height);
    media.style.visibility = '';
    this._message(null);
    this._renderZoom();
    if (media.tagName === 'VIDEO') { const p = media.play(); if (p && p.catch) p.catch(() => {}); }
  }

  _zoomStep(dir) {
    if (!this._viewport) return;
    this._viewport.step(dir);
    this._renderZoom();
  }

  _fit() {
    if (!this._viewport) return;
    this._viewport.fit();
    this._renderZoom();
  }

  _oneToOne() {
    if (!this._viewport) return;
    this._viewport.oneToOne();
    this._renderZoom();
  }

  _toggleBackdrop() {
    const view = this._el.querySelector('.cm-mv-view');
    const next = view.dataset.bg === 'light' ? 'dark' : 'light';
    view.dataset.bg = next;
    MediaViewer._store(MediaViewer.BACKDROP_KEY, next);
  }

  _renderZoom() {
    if (!this._el) return;
    const vp = this._viewport;
    const pct = this._el.querySelector('.cm-mv-pct');
    pct.textContent = vp && this._entry ? vp.percent() + '%' : '';
    const view = this._el.querySelector('.cm-mv-view');
    view.classList.toggle('is-zoomed', !!vp && !vp.isFit());
    this._el.querySelector('.cm-mv-fit').classList.toggle('is-on', !!vp && vp.isFit());
  }

  _renderPosition() {
    const n = this._items.length;
    this._el.querySelector('.cm-mv-pos').textContent = n > 1 ? (this._index + 1) + ' of ' + n : '';
    this._el.classList.toggle('is-single', n <= 1);
  }

  _message(text) {
    const msg = this._el.querySelector('.cm-mv-msg');
    msg.hidden = !text;
    msg.textContent = text || '';
    if (text) {
      this._el.querySelector('.cm-mv-stage').innerHTML = '';
      this._video.attach(null);
      this._renderZoom();
    }
  }

  _renderStrip() {
    const strip = this._el.querySelector('.cm-mv-strip');
    strip.innerHTML = '';
    strip.hidden = this._items.length <= 1;
    if (strip.hidden) return;
    this._items.forEach((item, i) => strip.appendChild(this._thumb(item, i)));
  }

  _thumb(item, i) {
    const af = item.artifact;
    const btn = Dom.el('button', 'cm-mv-thumb');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.title = af.title || (af.type === 'video' ? 'Video' : 'Image');
    btn.setAttribute('aria-label', (i + 1) + ': ' + btn.title);
    if (af.type === 'video') btn.classList.add('is-video');
    btn.addEventListener('click', () => this.show(i));
    this._ctx.mediaCache.load(af.id).then((entry) => {
      if (!entry || !btn.isConnected) return;
      const isVideo = af.type === 'video' && !/^image\//i.test(entry.mime || '');
      const media = document.createElement(isVideo ? 'video' : 'img');
      if (isVideo) { media.muted = true; media.preload = 'metadata'; media.src = (entry.url || entry.dataUrl) + '#t=0.1'; } else { media.alt = ''; media.src = entry.url || entry.dataUrl; }
      btn.appendChild(media);
    });
    return btn;
  }

  _markStrip() {
    const thumbs = this._el.querySelectorAll('.cm-mv-thumb');
    thumbs.forEach((t, i) => {
      const on = i === this._index;
      t.classList.toggle('is-current', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on && typeof t.scrollIntoView === 'function') t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }

  _preloadNeighbours() {
    const n = this._items.length;
    if (n <= 1) return;
    for (const d of [1, -1]) {
      const it = this._items[(((this._index + d) % n) + n) % n];
      if (it) this._ctx.mediaCache.load(it.artifact.id);
    }
  }

  _renderDetails(item) {
    const box = this._el.querySelector('.cm-mv-details');
    const d = MediaDetails.of(item);
    const isImage = item.artifact.type === 'image';
    const prompt = d.prompt
      ? '<div class="cm-mv-prompt" title="Click to expand">' + HtmlEscaper.escape(d.prompt) + '</div>'
      : '<div class="cm-mv-prompt is-empty">No prompt recorded for this ' + (isImage ? 'image' : 'video') + '.</div>';
    const meta = d.meta.length ? '<div class="cm-mv-meta">' + d.meta.map((m) => '<span>' + HtmlEscaper.escape(m) + '</span>').join('') + '</div>' : '';
    const act = (cls, label, title, show = true) => (show ? '<button type="button" class="cm-mv-act ' + cls + '" title="' + title + '">' + label + '</button>' : '');
    box.innerHTML = prompt + meta
      + '<div class="cm-mv-acts">'
      +   act('cm-mv-copyp', ChatIcons.copy + 'Copy prompt', 'Copy the prompt', !!d.prompt)
      +   act('cm-mv-copyi', ChatIcons.image + 'Copy image', 'Copy the image to the clipboard', isImage)
      +   act('cm-mv-dl', ChatIcons.download + 'Download', 'Download')
      +   act('cm-mv-mark', ChatIcons.brush + 'Mark area', 'Mark an area to edit', isImage && !!this._ctx.regions)
      +   act('cm-mv-ref', ChatIcons.paperclip + 'Use as reference', 'Attach this image to your next message', isImage)
      +   act('cm-mv-again', ChatIcons.retry + 'Make another', 'Ask for another take in the composer')
      + '</div>';
    const on = (sel, fn) => { const b = box.querySelector(sel); if (b) b.addEventListener('click', fn); };
    on('.cm-mv-prompt', (e) => e.currentTarget.classList.toggle('is-open'));
    on('.cm-mv-copyp', (e) => this._copyText(d.prompt, e.currentTarget));
    on('.cm-mv-copyi', (e) => this._copyImage(e.currentTarget));
    on('.cm-mv-dl', () => this._hooks.onDownload && this._hooks.onDownload());
    on('.cm-mv-mark', () => this._ctx.regions.markArtifact({ id: item.artifact.id, title: item.artifact.title }));
    on('.cm-mv-ref', () => this._useAsReference(item));
    on('.cm-mv-again', () => this._makeAnother(item, d.prompt));
  }

  async _copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); MediaViewer._flash(btn, 'Copied'); } catch (_) { MediaViewer._flash(btn, 'Copy failed'); }
  }

  async _copyImage(btn) {
    const entry = this._entry;
    if (!entry) return;
    try {
      const blob = await MediaViewer._pngBlob(entry);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      MediaViewer._flash(btn, 'Copied');
    } catch (_) {
      MediaViewer._flash(btn, 'Copy failed');
    }
  }

  async _useAsReference(item) {
    const entry = await this._ctx.mediaCache.load(item.artifact.id);
    if (!entry) return;
    const ext = (entry.mime || 'image/png').split('/')[1] || 'png';
    const name = String(item.artifact.title || 'image').replace(/[^\w.-]+/g, '_').slice(0, 60) + '.' + ext;
    this._ctx.attachments.add([{ name, size: Math.floor((entry.b64.length * 3) / 4), kind: 'image', mime: entry.mime || 'image/png', base64: entry.b64 }]);
    this._ctx.composer.focus();
  }

  _makeAnother(item, prompt) {
    const ta = this._ctx.root.querySelector('.cm-composer-bar .cm-composer textarea') || this._ctx.root.querySelector('.cm-composer textarea');
    if (!ta) return;
    const noun = item.artifact.type === 'video' ? 'video' : 'image';
    const title = item.artifact.title || noun;
    ta.value = prompt
      ? 'Make another ' + noun + ' like "' + title + '" with the same prompt and a new seed.'
      : 'Make another take on the ' + noun + ' "' + title + '".';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }

  _isVideo() {
    return !!(this._el && this._el.classList.contains('is-video'));
  }

  static async _pngBlob(entry) {
    const src = entry.url || entry.dataUrl;
    if (/^image\/png$/i.test(entry.mime || '')) return (await fetch(src)).blob();
    const img = new Image();
    img.src = src;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d').drawImage(img, 0, 0);
    return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/png'));
  }

  static _flash(btn, text) {
    if (!btn) return;
    const prev = btn.innerHTML;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => { btn.innerHTML = prev; btn.disabled = false; }, 1200);
  }

  static _local(e, el) {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  static _typing(t) {
    if (!t || !t.closest) return false;
    return !!t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .monaco-editor');
  }

  static _load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  static _store(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }
}
