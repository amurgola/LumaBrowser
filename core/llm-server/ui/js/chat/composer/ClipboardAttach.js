export default class ClipboardAttach {
  static IMAGE_RE = /^image\//;

  static IMAGE_MAX = 8 * 1024 * 1024;

  static EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

  static GENERIC_NAME = /^image\.(png|jpe?g|gif|webp|bmp)$/i;

  constructor(ctx) {
    this._ctx = ctx;
  }

  onPaste(e) {
    const dt = e.clipboardData;
    if (!dt) return null;
    const files = Array.from(dt.files || []);
    if (!files.length) return null;
    if (String(dt.getData('text/plain') || '').trim()) return null;
    e.preventDefault();
    return this._stage(files);
  }

  async _stage(files) {
    const images = files.filter((f) => ClipboardAttach.IMAGE_RE.test(f.type || ''));
    const others = files.filter((f) => !ClipboardAttach.IMAGE_RE.test(f.type || ''));
    const staged = (await Promise.all(images.map((f) => this._readImage(f)))).concat(await this._readOthers(others));
    if (!staged.length) return;
    this._ctx.attachments.add(staged);
    this._ctx.composer.focus();
  }

  async _readOthers(files) {
    const api = this._ctx.api;
    if (!files.length || !api.readDroppedAttachments) return [];
    try {
      const r = await api.readDroppedAttachments(files);
      return (r && r.success && Array.isArray(r.files)) ? r.files : [];
    } catch (_) {
      return [];
    }
  }

  _readImage(file) {
    const name = ClipboardAttach.nameFor(file, new Date());
    if (file.size > ClipboardAttach.IMAGE_MAX) {
      return Promise.resolve({ name, size: file.size, kind: 'image', error: 'Image is too large (max 8 MB).' });
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        resolve({ name, size: file.size, kind: 'image', mime: file.type || 'image/png', base64: url.slice(url.indexOf(',') + 1) });
      };
      reader.onerror = () => resolve({ name, size: file.size, kind: 'image', error: 'The pasted image could not be read.' });
      reader.readAsDataURL(file);
    });
  }

  static nameFor(file, now) {
    if (file.name && !ClipboardAttach.GENERIC_NAME.test(file.name)) return file.name;
    const pad = (n) => String(n).padStart(2, '0');
    const ext = ClipboardAttach.EXT[file.type] || 'png';
    return 'Pasted image ' + pad(now.getHours()) + '.' + pad(now.getMinutes()) + '.' + pad(now.getSeconds()) + '.' + ext;
  }
}
