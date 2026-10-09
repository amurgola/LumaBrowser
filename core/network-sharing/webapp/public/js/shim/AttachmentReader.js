export default class AttachmentReader {
  static ACCEPT = 'image/*';
  static IMAGE_RE = /^image\//;
  static ONLY_IMAGES = 'Only images can be attached here.';

  constructor({ doc, FileReaderImpl = globalThis.FileReader }) {
    this._doc = doc;
    this._FileReader = FileReaderImpl;
  }

  pick() {
    return new Promise((resolve) => {
      const input = this._doc.createElement('input');
      input.type = 'file';
      input.accept = AttachmentReader.ACCEPT;
      input.multiple = true;
      input.onchange = () => this._picked(Array.from(input.files || []), resolve);
      input.click();
    });
  }

  async readDropped(files) {
    const all = Array.from(files || []);
    const images = all.filter((f) => AttachmentReader.IMAGE_RE.test(f.type));
    const rejected = all.filter((f) => !AttachmentReader.IMAGE_RE.test(f.type))
      .map((f) => ({ name: f.name, size: f.size, error: AttachmentReader.ONLY_IMAGES }));
    const read = await this.readAll(images);
    return { success: true, files: read.concat(rejected) };
  }

  readAll(files) {
    return Promise.all(files.map((f) => this._read(f)));
  }

  _picked(files, resolve) {
    if (!files.length) return resolve({ success: true, canceled: true, files: [] });
    return this.readAll(files).then((out) => resolve({ success: true, files: out }));
  }

  _read(file) {
    return new Promise((resolve) => {
      const reader = new this._FileReader();
      reader.onload = () => resolve(AttachmentReader._attachment(file, String(reader.result || '')));
      reader.onerror = () => resolve({ name: file.name, kind: 'image', error: 'read failed' });
      reader.readAsDataURL(file);
    });
  }

  static _attachment(file, dataUrl) {
    return {
      name: file.name,
      size: file.size,
      kind: AttachmentReader.IMAGE_RE.test(file.type) ? 'image' : 'file',
      mime: file.type || 'image/png',
      base64: dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : dataUrl,
    };
  }
}
