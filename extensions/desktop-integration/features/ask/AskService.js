const AskSettings = require('./AskSettings');
const WindowCapture = require('./WindowCapture');

class AskService {
  static MODES = ['text', 'screenshot', 'both'];
  static MAX_SOURCE_CHARS = 200;
  static MAX_IMAGE_BASE64 = Math.ceil((8 * 1024 * 1024 * 4) / 3) + 4;

  constructor({ settings, handoff, windows, capture = new WindowCapture(), notify = () => {}, log = null, now = () => new Date() }) {
    this._settings = new AskSettings(settings);
    this._handoff = handoff;
    this._windows = windows;
    this._capture = capture;
    this._notify = notify;
    this._log = log || { info() {}, warn() {}, error() {}, debug() {} };
    this._now = now;
    this._busy = false;
  }

  config() {
    return { status: 200, body: { success: true, ...this._settings.all(), modes: AskService.MODES.slice() } };
  }

  async askWindow(body = {}, client = null) {
    const hwnd = AskService.parseHwnd(body.hwnd);
    if (hwnd == null) return AskService._bad('hwnd is required: a window handle as a number or a hex string such as "0x1A2B"');
    const mode = body.mode == null || body.mode === '' ? this._settings.get('defaultMode') : String(body.mode);
    if (!AskService.MODES.includes(mode)) return AskService._bad(`mode must be one of ${AskService.MODES.join(', ')}`);
    if (body.prompt != null && typeof body.prompt !== 'string') return AskService._bad('prompt must be a string');
    if (this._busy) return AskService._fail(409, 'Luma is still reading the previous window.', { code: 'BUSY' });
    this._busy = true;
    try {
      return await this._askWindow(hwnd, mode, body, client);
    } catch (err) {
      return this._failed(500, (err && err.message) || String(err), {});
    } finally {
      this._busy = false;
    }
  }

  async askForeground(client = 'luma-hotkey') {
    const why = this._capture.unavailable();
    if (why) return this._failed(503, why, { code: WindowCapture.CODES.UNAVAILABLE });
    const hwnd = this._capture.foregroundWindow();
    if (!hwnd) return AskService._fail(404, 'No window is in front.', { code: WindowCapture.CODES.NO_WINDOW });
    return this.askWindow({ hwnd }, client);
  }

  async askContent(body = {}, client = null) {
    if (body.text != null && typeof body.text !== 'string') return AskService._bad('text must be a string');
    if (body.prompt != null && typeof body.prompt !== 'string') return AskService._bad('prompt must be a string');
    if (body.imageBase64 != null && typeof body.imageBase64 !== 'string') return AskService._bad('imageBase64 must be a base64 string');
    const image = body.imageBase64 ? AskService.parseImage(body.imageBase64, body.imageMime) : null;
    if (image && image.error) return AskService._bad(image.error);
    const text = body.text ? body.text.trim() : '';
    if (!text && !image && !(body.prompt && body.prompt.trim())) return AskService._bad('Give text, imageBase64 or a prompt');
    const source = AskService._source(body.source, client);
    const label = AskService._fileLabel(source.app || source.windowTitle || 'content');
    const attachments = [];
    let truncated = false;
    if (text) {
      const capped = this._cap(text);
      truncated = capped.truncated;
      attachments.push({ kind: 'text', name: `${label} text.txt`, mime: 'text/plain', text: capped.text });
    }
    if (image) attachments.push({ kind: 'image', name: `${label} image.${image.ext}`, mime: image.mime, data: image.data });
    const result = await this._handoff.open({ prompt: this._prompt(body.prompt), attachments, autoSend: this._autoSend(body.autoSend), source });
    if (!result || !result.success) return this._failed(503, (result && result.error) || 'Chat handoff failed', {});
    return { status: 200, body: { success: true, ...AskService._handoffFields(result), captured: { text: text ? { chars: Math.min(text.length, this._settings.get('maxTextChars')), truncated } : null, image: !!image } } };
  }

  async _askWindow(hwnd, mode, body, client) {
    const found = this._capture.describe(hwnd);
    if (found.own) {
      const focused = !!(this._windows && this._windows.focusMainWindow());
      return { status: 200, body: { success: true, ownWindow: true, focused, window: AskService._windowFacts(found.w) } };
    }
    if (found.error) return this._failed(found.status || 400, found.error, { code: found.code, window: { hwnd } });
    const w = found.w;
    const captured = await this._captureWindow(w, mode);
    if (!captured.shot && captured.text == null) {
      return this._failed(422, `Luma could not read "${w.title || w.app || hwnd}"`, { code: 'CAPTURE_FAILED', errors: captured.errors, window: AskService._windowFacts(w) });
    }
    const source = { client: client || null, app: AskService._appName(w), windowTitle: String(w.title || '').slice(0, AskService.MAX_SOURCE_CHARS) };
    const result = await this._handoff.open({ prompt: this._prompt(body.prompt), attachments: this._attachments(w, captured), autoSend: this._autoSend(body.autoSend), source });
    if (!result || !result.success) return this._failed(503, (result && result.error) || 'Chat handoff failed', { window: AskService._windowFacts(w) });
    return {
      status: 200,
      body: {
        success: true,
        ...AskService._handoffFields(result),
        window: AskService._windowFacts(w),
        captured: {
          mode,
          text: captured.text == null ? null : { chars: captured.text.length, truncated: captured.textTruncated },
          screenshot: captured.shot ? { width: captured.shot.width, height: captured.shot.height, method: captured.shot.method } : null,
          ...(Object.keys(captured.errors).length ? { errors: captured.errors } : {}),
        },
      },
    };
  }

  async _captureWindow(w, mode) {
    const out = { shot: null, text: null, textTruncated: false, errors: {} };
    if (mode !== 'text') {
      try {
        out.shot = this._capture.screenshot(w);
      } catch (err) {
        out.errors.screenshot = (err && err.message) || String(err);
      }
    }
    if (mode !== 'screenshot') {
      try {
        const read = await this._capture.text(w, { maxChars: this._settings.get('maxTextChars') });
        const capped = this._cap(read.text);
        out.text = capped.text;
        out.textTruncated = capped.truncated || !!read.truncated;
      } catch (err) {
        out.errors.text = (err && err.message) || String(err);
      }
    }
    return out;
  }

  _attachments(w, captured) {
    const label = AskService._fileLabel(AskService._appName(w) || 'window');
    const list = [];
    if (captured.text != null) {
      const header = [
        `Window: ${w.title || '(untitled)'}`,
        `App: ${w.app || 'unknown'}`,
        `Captured: ${this._now().toISOString()}`,
        captured.textTruncated ? 'Note: the text was cut to fit.' : null,
      ].filter(Boolean).join('\n');
      const body = captured.text || '(UI Automation found no readable text in this window.)';
      list.push({ kind: 'text', name: `${label} window text.txt`, mime: 'text/plain', text: `${header}\n\n${body}` });
    }
    if (captured.shot) list.push({ kind: 'image', name: `${label} window.png`, mime: 'image/png', data: captured.shot.data });
    return list;
  }

  _prompt(prompt) {
    const given = typeof prompt === 'string' ? prompt.trim() : '';
    return given || this._settings.get('defaultPrompt');
  }

  _autoSend(value) {
    return typeof value === 'boolean' ? value : !!this._settings.get('autoSend');
  }

  _cap(text) {
    const max = this._settings.get('maxTextChars');
    const s = String(text || '');
    return s.length > max ? { text: s.slice(0, max), truncated: true } : { text: s, truncated: false };
  }

  _failed(status, error, details) {
    this._log.warn(`ask failed: ${error}`);
    if (this._settings.get('notifyOnError')) {
      try { this._notify('Ask Luma', error); } catch (_) {}
    }
    return AskService._fail(status, error, details);
  }

  static parseHwnd(value) {
    if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? value : null;
    if (typeof value !== 'string') return null;
    const s = value.trim();
    let n = null;
    if (/^0x[0-9a-f]{1,16}$/i.test(s)) n = parseInt(s.slice(2), 16);
    else if (/^[0-9]{1,20}$/.test(s)) n = parseInt(s, 10);
    else if (/^[0-9a-f]{1,16}$/i.test(s)) n = parseInt(s, 16);
    return n != null && Number.isSafeInteger(n) && n > 0 ? n : null;
  }

  static parseImage(value, mimeHint) {
    let data = String(value).trim();
    const dataUrl = /^data:([^;,]+)?(;base64)?,/i.exec(data);
    if (dataUrl) data = data.slice(dataUrl[0].length);
    data = data.replace(/\s+/g, '');
    if (!data || data.length > AskService.MAX_IMAGE_BASE64 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(data)) return { error: 'imageBase64 is not valid base64 (or is larger than 8 MB)' };
    const head = Buffer.from(data.slice(0, 24), 'base64');
    const sniffed = AskService._sniff(head);
    const mime = sniffed || (typeof mimeHint === 'string' && /^image\/(png|jpeg|gif|webp)$/i.test(mimeHint) ? mimeHint.toLowerCase() : null);
    if (!mime) return { error: 'imageBase64 must be a PNG, JPEG, GIF or WebP image' };
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' }[mime];
    return { data, mime, ext };
  }

  static _sniff(b) {
    if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
    if (b.length >= 4 && b.toString('latin1', 0, 4) === 'GIF8') return 'image/gif';
    if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
    return null;
  }

  static _source(source, client) {
    const s = source && typeof source === 'object' ? source : {};
    const str = (v) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, AskService.MAX_SOURCE_CHARS) : null);
    return { client: str(s.client) || client || null, app: str(s.app), windowTitle: str(s.windowTitle) };
  }

  static _appName(w) {
    if (!w.app) return null;
    const base = String(w.app).replace(/\.exe$/i, '');
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : null;
  }

  static _fileLabel(value) {
    const cleaned = String(value || '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    return cleaned || 'window';
  }

  static _windowFacts(w) {
    return { hwnd: w.hwnd, title: w.title || '', app: w.app || null };
  }

  static _handoffFields(result) {
    return { conversationId: result.conversationId || null, autoSent: !!result.autoSent, attached: result.attached || 0, rejected: result.rejected || [] };
  }

  static _bad(error) {
    return AskService._fail(400, error, {});
  }

  static _fail(status, error, details) {
    return { status, body: { success: false, error, ...details } };
  }
}

module.exports = AskService;
