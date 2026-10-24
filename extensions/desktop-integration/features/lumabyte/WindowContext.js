const ScreenshotImage = require('../../../../core/desktop/service/ScreenshotImage');

class WindowContext {
  static TEXT_NODES = 150;
  static TEXT_CHARS = 8000;

  constructor({ capture, nativeImage, uia, observer, probe }) {
    this._capture = capture;
    this._nativeImage = nativeImage;
    this._uia = uia;
    this._observer = observer;
    this._probe = probe;
  }

  async read(hwnd, { screenshot = true, text = true } = {}) {
    const title = this._probe.title(hwnd);
    const app = this._probe.app(hwnd);
    const notes = [];
    let png = null;
    if (screenshot) {
      try {
        png = this.screenshot(hwnd);
      } catch (err) {
        notes.push(`no screenshot (${(err && err.message) || err})`);
      }
    }
    let body = '';
    if (text) {
      try {
        body = await this.accessibleText(hwnd, { title, app });
      } catch (err) {
        notes.push(`no window text (${(err && err.message) || err})`);
      }
    }
    return { title, app, png, text: body, notes };
  }

  screenshot(hwnd) {
    const rect = this._probe.rect(hwnd);
    if (!rect || rect.width <= 0 || rect.height <= 0) throw new Error('the window has no size');
    if (this._probe.minimized(hwnd)) throw new Error('the window is minimized');
    let shot = this._capture.captureBGRA({ hwnd, rect });
    if (this._capture.isBlank(shot.bgra)) shot = this._capture.captureBGRA({ rect });
    return ScreenshotImage.fromShot(this._nativeImage, shot).toPNG().toString('base64');
  }

  async accessibleText(hwnd, { title, app }) {
    const w = { hwnd, title, pid: app.pid, className: app.className };
    const { nodes, truncated } = await this._observer.read(this._uia(), w, WindowContext.TEXT_NODES);
    const lines = (nodes || [])
      .filter((n) => n && String(n.name || '').trim())
      .map((n) => `${n.role}: ${String(n.name).replace(/\s+/g, ' ').trim()}${n.enabled === false ? ' (disabled)' : ''}`);
    let out = lines.join('\n');
    if (out.length > WindowContext.TEXT_CHARS) out = `${out.slice(0, WindowContext.TEXT_CHARS)}\n...`;
    else if (truncated) out += '\n...';
    return out;
  }
}

module.exports = WindowContext;
