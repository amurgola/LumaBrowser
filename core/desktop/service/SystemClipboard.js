class SystemClipboard {
  static STANDARD_TYPES = ['text/plain', 'text/html', 'text/rtf', 'image/png'];
  static PNG = 'image/png';
  static SENDABLE = /^(text|image)\//;

  constructor({ clipboard, ClipboardItem }) {
    this._clipboard = clipboard;
    this._ClipboardItem = ClipboardItem;
  }

  static fromElectron(electron) {
    if (!electron || !electron.clipboard) return null;
    return new SystemClipboard({ clipboard: electron.clipboard, ClipboardItem: electron.ClipboardItem });
  }

  async readText() {
    return String((await this._clipboard.readText()) || '');
  }

  async writeText(text) {
    await this._clipboard.writeText(String(text));
  }

  async readSelectionText() {
    const selection = this._clipboard.selection;
    if (!selection || typeof selection.readText !== 'function') return '';
    return String((await selection.readText()) || '');
  }

  async readImagePng() {
    for (const item of await this._clipboard.read()) {
      if (!item.types.includes(SystemClipboard.PNG)) continue;
      const blob = await item.getType(SystemClipboard.PNG);
      const png = Buffer.from(await blob.arrayBuffer());
      if (png.length) return png;
    }
    return null;
  }

  async hasTextOrImage() {
    const items = await this._clipboard.read();
    return items.some((item) => item.types.some((type) => SystemClipboard.SENDABLE.test(type)));
  }

  async snapshot() {
    try {
      const entries = [];
      for (const item of await this._clipboard.read()) entries.push(await SystemClipboard._payloadsOf(item));
      return entries.filter((entry) => Object.keys(entry).length);
    } catch (_) {
      return null;
    }
  }

  async restore(snapshot) {
    if (!snapshot || !snapshot.length) return this._clipboard.clear();
    try {
      return await this._write(snapshot);
    } catch (_) {
      return this._write(SystemClipboard._standardOnly(snapshot));
    }
  }

  async restoreIfStill(text, snapshot) {
    if (!snapshot) return false;
    try {
      if ((await this.readText()) !== text) return false;
      await this.restore(snapshot);
      return true;
    } catch (_) {
      return false;
    }
  }

  async _write(entries) {
    if (!entries.length) return this._clipboard.clear();
    return this._clipboard.write(entries.map((entry) => new this._ClipboardItem(entry)));
  }

  static async _payloadsOf(item) {
    const entry = {};
    for (const type of item.types) {
      try { entry[type] = await item.getType(type); } catch (_) {}
    }
    return entry;
  }

  static _standardOnly(snapshot) {
    return snapshot
      .map((entry) => Object.fromEntries(Object.entries(entry).filter(([type]) => SystemClipboard.STANDARD_TYPES.includes(type))))
      .filter((entry) => Object.keys(entry).length);
  }
}

module.exports = SystemClipboard;
