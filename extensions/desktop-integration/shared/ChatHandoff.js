const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

class ChatHandoff {
  static MAX_PROMPT = 100000;
  static MAX_ATTACHMENTS = 10;
  static TEXT_MAX = 200 * 1024;
  static IMAGE_MAX = 8 * 1024 * 1024;
  static TAB_UNAVAILABLE = 'The AI chat tab is not available. Enable the LLM feature first.';

  constructor({ getLlm = () => null, getChatStore = () => null, windows = null, reader = null, tmpDir = os.tmpdir() } = {}) {
    this._getLlm = getLlm;
    this._getChatStore = getChatStore;
    this._windows = windows;
    this._reader = reader || ChatHandoff._defaultReader();
    this._tmpDir = tmpDir;
  }

  async open({ prompt = '', attachments = [], autoSend = false, source = null } = {}) {
    try {
      const llm = this._getLlm();
      if (!llm || typeof llm.openChat !== 'function' || typeof llm.setChatIntent !== 'function') {
        return { success: false, error: ChatHandoff.TAB_UNAVAILABLE };
      }
      const text = String(prompt == null ? '' : prompt).slice(0, ChatHandoff.MAX_PROMPT);
      const { files, rejected } = await this.readAttachments(attachments);
      if (!text.trim() && !files.length) return { success: false, error: 'Give a prompt or at least one attachment', rejected };
      const send = !!autoSend && this._canAutoSend(llm);
      const conversationId = send ? this._createConversation(llm, source) : null;
      llm.setChatIntent({ compose: { conversationId, prompt: text, attachments: files, autoSend: send, source: ChatHandoff._source(source) } });
      if (!llm.openChat()) {
        llm.takeChatIntent();
        return { success: false, error: ChatHandoff.TAB_UNAVAILABLE };
      }
      this._focus(llm);
      return { success: true, conversationId, autoSent: send, attached: files.length, rejected };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  async readAttachments(attachments) {
    const files = [];
    const rejected = [];
    const list = Array.isArray(attachments) ? attachments.slice(0, ChatHandoff.MAX_ATTACHMENTS) : [];
    if (Array.isArray(attachments) && attachments.length > list.length) rejected.push({ name: '(extra)', error: `At most ${ChatHandoff.MAX_ATTACHMENTS} attachments` });
    for (const item of list) {
      const entry = await this._readOne(item || {});
      if (entry.error) rejected.push({ name: entry.name || '(attachment)', error: entry.error });
      else files.push(entry);
    }
    return { files, rejected };
  }

  async _readOne(item) {
    const kind = String(item.kind || (item.path ? 'file' : item.text != null ? 'text' : 'file'));
    const name = ChatHandoff._name(item, kind);
    if (item.path) return (await this._reader.read([String(item.path)]))[0];
    if (kind === 'text') return ChatHandoff._text(name, item.text != null ? String(item.text) : ChatHandoff._decode(item.data, 'utf8'));
    if (item.data == null) return { name, error: 'Give data (base64), path or text' };
    if (kind === 'image') return ChatHandoff._image(name, item.mime, String(item.data));
    return this._fromBytes(name, Buffer.from(String(item.data), 'base64'));
  }

  async _fromBytes(name, bytes) {
    const dir = path.join(this._tmpDir, 'luma-chat-handoff');
    const file = path.join(dir, `${crypto.randomBytes(6).toString('hex')}-${name}`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, bytes);
      const entry = (await this._reader.read([file]))[0];
      return { ...entry, name };
    } finally {
      try { fs.unlinkSync(file); } catch (_) {}
    }
  }

  _canAutoSend(llm) {
    return typeof llm.getLastModelRef !== 'function' || !!llm.getLastModelRef();
  }

  _createConversation(llm, source) {
    const store = this._getChatStore();
    if (!store || typeof store.createConversation !== 'function') return null;
    const modelRef = typeof llm.getLastModelRef === 'function' ? llm.getLastModelRef() : null;
    const title = source && source.app ? `From ${String(source.app).slice(0, 40)}` : 'New chat';
    const conv = store.createConversation({ title, modelRef, toolsEnabled: true, mode: 'chat' });
    return conv ? conv.id : null;
  }

  _focus(llm) {
    try {
      const tabs = llm.tabViewManager;
      const win = tabs && typeof tabs.windowOfTab === 'function' && llm.pinnedTabId ? tabs.windowOfTab(llm.pinnedTabId) : null;
      if (win && !win.isDestroyed()) {
        if (win.isMinimized()) win.restore();
        win.show();
        if (process.platform === 'win32') { win.setAlwaysOnTop(true); win.focus(); win.setAlwaysOnTop(false); } else win.focus();
        return true;
      }
    } catch (_) {}
    return this._windows ? this._windows.focusMainWindow() : false;
  }

  static _text(name, text) {
    const truncated = text.length > ChatHandoff.TEXT_MAX;
    const body = truncated ? text.slice(0, ChatHandoff.TEXT_MAX) : text;
    const ext = path.extname(name).replace(/^\./, '').toLowerCase();
    const entry = { name, size: Buffer.byteLength(body), kind: 'text', language: ext || 'text', text: body };
    if (truncated) entry.truncated = true;
    return entry;
  }

  static _image(name, mime, base64) {
    const clean = base64.replace(/^data:[^;]+;base64,/, '');
    const size = Math.floor(clean.length * 3 / 4);
    if (size > ChatHandoff.IMAGE_MAX) return { name, error: 'Image is too large (max 8 MB).' };
    const type = /^image\/(png|jpeg|gif|webp)$/i.test(String(mime || '')) ? String(mime).toLowerCase() : ChatHandoff._mimeFromName(name);
    return { name, size, kind: 'image', mime: type, base64: clean };
  }

  static _mimeFromName(name) {
    const ext = path.extname(name).toLowerCase();
    return { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' }[ext] || 'image/jpeg';
  }

  static _name(item, kind) {
    const raw = item.name || (item.path ? path.basename(String(item.path)) : '');
    const clean = path.basename(String(raw)).replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').slice(0, 120);
    return clean || (kind === 'image' ? 'image.png' : kind === 'text' ? 'text.txt' : 'file');
  }

  static _decode(data, encoding) {
    return data == null ? '' : Buffer.from(String(data), 'base64').toString(encoding);
  }

  static _source(source) {
    if (!source || typeof source !== 'object') return null;
    const pick = (v) => (v == null ? null : String(v).slice(0, 200));
    return { client: pick(source.client), app: pick(source.app), windowTitle: pick(source.windowTitle) };
  }

  static _defaultReader() {
    const AttachmentReader = require('../../../core/llm-server/ipc/AttachmentReader');
    return new AttachmentReader();
  }
}

module.exports = ChatHandoff;
