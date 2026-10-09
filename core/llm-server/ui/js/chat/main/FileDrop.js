import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';

export default class FileDrop {
  constructor(ctx) {
    this._ctx = ctx;
    this._depth = 0;
  }

  install() {
    const { api, root, els } = this._ctx;
    if (!api.readDroppedAttachments) return;
    els.content.appendChild(Dom.el('div', 'cm-drop-veil',
      '<div class="cm-drop-card">' + ChatIcons.paperclip + '<span>Drop to attach</span></div>'));
    root.addEventListener('dragenter', (e) => this._onEnter(e));
    root.addEventListener('dragleave', (e) => this._onLeave(e));
    root.addEventListener('dragover', (e) => this._onOver(e));
    root.addEventListener('drop', (e) => this._onDrop(e));
    window.addEventListener('dragend', () => this._reset());
    window.addEventListener('blur', () => this._reset());
  }

  static hasFiles(e) {
    return !!(e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files'));
  }

  _setVeil(on) {
    this._ctx.els.content.classList.toggle('cm-dropping', on);
  }

  _reset() {
    this._depth = 0;
    this._setVeil(false);
  }

  _onEnter(e) {
    if (!FileDrop.hasFiles(e)) return;
    this._depth++;
    this._setVeil(true);
  }

  _onLeave(e) {
    if (!FileDrop.hasFiles(e)) return;
    this._depth = Math.max(0, this._depth - 1);
    if (!this._depth) this._setVeil(false);
  }

  _onOver(e) {
    if (!FileDrop.hasFiles(e) || e.defaultPrevented) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }

  async _onDrop(e) {
    if (!FileDrop.hasFiles(e)) return;
    this._reset();
    if (e.defaultPrevented) return;
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (!dropped.length) return;
    try {
      const r = await this._ctx.api.readDroppedAttachments(dropped);
      if (r && r.success && Array.isArray(r.files) && r.files.length) {
        this._ctx.attachments.add(r.files);
        this._ctx.composer.focus();
      }
    } catch (_) {}
  }
}
