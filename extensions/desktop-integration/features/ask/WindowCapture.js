const path = require('path');
const AntiCheatDetector = require('../../../../core/desktop/AntiCheatDetector');
const SystemPromptDetector = require('../../../../core/desktop/SystemPromptDetector');
const ScreenshotImage = require('../../../../core/desktop/service/ScreenshotImage');
const WindowObserver = require('../../../../core/desktop/service/WindowObserver');
const WindowText = require('./WindowText');

class WindowCapture {
  static GA_ROOT = 2;
  static MIN_WIDTH = 40;
  static MIN_HEIGHT = 30;
  static SPARSE_CHARS = 40;
  static CHROMIUM_RETRY_MS = WindowObserver.CHROMIUM_RETRY_MS;
  static WAKE_TIMEOUT_MS = 5000;

  static CODES = {
    NO_WINDOW: 'NO_WINDOW',
    SYSTEM_PROMPT: 'SYSTEM_PROMPT',
    ANTI_CHEAT: 'ANTI_CHEAT',
    ELEVATED: 'ELEVATED',
    PROTECTED: 'PROTECTED',
    MINIMIZED: 'MINIMIZED',
    NOT_VISIBLE: 'NOT_VISIBLE',
    UNAVAILABLE: 'UNAVAILABLE',
  };

  constructor({
    getDesktop = () => global.__lumaDesktop || null,
    getNativeImage = () => require('electron').nativeImage,
    textReader = new WindowText(),
    ownPids = WindowCapture.defaultOwnPids,
    isCloaked = (hwnd) => require('../../../../core/desktop/win32/Win32Windows').isCloaked(hwnd),
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    platform = process.platform,
  } = {}) {
    this._getDesktop = getDesktop;
    this._getNativeImage = getNativeImage;
    this._text = textReader;
    this._ownPids = ownPids;
    this._isCloaked = isCloaked;
    this._sleep = sleep;
    this._platform = platform;
  }

  unavailable() {
    if (this._platform !== 'win32') return 'Asking about a window is only available on Windows.';
    const desktop = this._getDesktop();
    if (!desktop || !desktop.win) return 'Desktop capture is not ready yet. Try again in a moment.';
    return null;
  }

  describe(hwnd) {
    const why = this.unavailable();
    if (why) return WindowCapture._fail(why, WindowCapture.CODES.UNAVAILABLE, 503);
    const win = this._getDesktop().win;
    const api = win.load();
    if (typeof api.IsWindow === 'function' && !api.IsWindow(hwnd)) return WindowCapture._fail(`No window with hwnd ${hwnd}. It may have closed.`, WindowCapture.CODES.NO_WINDOW, 404);
    const root = (typeof api.GetAncestor === 'function' && api.GetAncestor(hwnd, WindowCapture.GA_ROOT)) || hwnd;
    const { pid } = win.processIdOf(root);
    if (!pid) return WindowCapture._fail(`No window with hwnd ${hwnd}. It may have closed.`, WindowCapture.CODES.NO_WINDOW, 404);
    const w = this._facts(win, api, root, pid);
    if (this._isOwn(pid)) return { own: true, w };
    const refusal = this.refusal(win, api, w);
    return refusal || { w };
  }

  refusal(win, api, w) {
    const C = WindowCapture.CODES;
    const label = w.title ? `"${w.title}"` : (w.app || 'That window');
    const prompt = SystemPromptDetector.detect({ exe: w.exe, className: w.className });
    if (prompt) return WindowCapture._fail(`${label} is a ${prompt.label}. Luma does not read system prompts.`, C.SYSTEM_PROMPT, 403);
    const antiCheat = w.exe ? AntiCheatDetector.detect(w.exe) : null;
    if (antiCheat) return WindowCapture._fail(`${label} is protected by ${antiCheat}. Luma does not read anti-cheat protected games.`, C.ANTI_CHEAT, 403);
    const elevated = WindowCapture._safe(() => win.isElevated(w.pid));
    if (elevated === true) return WindowCapture._fail(`${label} runs as administrator, so Windows does not let Luma read it.`, C.ELEVATED, 403);
    if (!w.exe && elevated == null) return WindowCapture._fail(`${label} belongs to a protected process that Luma cannot read.`, C.PROTECTED, 403);
    if (w.minimized) return WindowCapture._fail(`${label} is minimized. Restore it, then ask again.`, C.MINIMIZED, 409);
    const visible = typeof api.IsWindowVisible === 'function' ? !!api.IsWindowVisible(w.hwnd) : true;
    const cloaked = !!WindowCapture._safe(() => this._isCloaked(w.hwnd), false);
    const small = !w.rect || w.rect.width < WindowCapture.MIN_WIDTH || w.rect.height < WindowCapture.MIN_HEIGHT;
    if (!visible || cloaked || small) return WindowCapture._fail(`${label} is not visible on screen.`, C.NOT_VISIBLE, 409);
    return null;
  }

  foregroundWindow() {
    const desktop = this._getDesktop();
    const api = desktop && desktop.win ? desktop.win.load() : null;
    if (!api || typeof api.GetForegroundWindow !== 'function') return 0;
    const fg = api.GetForegroundWindow();
    if (!fg) return 0;
    return (typeof api.GetAncestor === 'function' && api.GetAncestor(fg, WindowCapture.GA_ROOT)) || fg;
  }

  screenshot(w) {
    const desktop = this._getDesktop();
    let captured;
    try {
      captured = desktop.capture({ hwnd: w.hwnd, rect: w.rect, title: w.title, minimized: false });
    } catch (err) {
      captured = { shot: desktop.win.captureBGRA({ rect: w.rect }), method: 'screen-region' };
    }
    const { shot, method } = captured;
    const image = ScreenshotImage.fromShot(this._getNativeImage(), shot);
    const size = image.getSize();
    return { data: image.toPNG().toString('base64'), mime: 'image/png', width: size.width, height: size.height, method };
  }

  async text(w, { maxChars = WindowText.DEFAULT_MAX_CHARS } = {}) {
    const desktop = this._getDesktop();
    const chromium = this._isChromium(desktop, w);
    if (chromium) await this._wake(desktop, w.hwnd);
    const first = await this._text.read(w.hwnd, { maxChars });
    if (!chromium || first.text.length >= WindowCapture.SPARSE_CHARS) return first;
    await this._sleep(WindowCapture.CHROMIUM_RETRY_MS);
    const second = await this._text.read(w.hwnd, { maxChars });
    return second.text.length > first.text.length ? second : first;
  }

  _facts(win, api, hwnd, pid) {
    const exe = WindowCapture._safe(() => win.processImagePath(pid));
    return {
      hwnd,
      title: WindowCapture._safe(() => win.windowText(hwnd), '') || '',
      className: WindowCapture._safe(() => win.className(hwnd), '') || '',
      pid,
      rect: WindowCapture._safe(() => win.windowRect(hwnd)),
      minimized: typeof api.IsIconic === 'function' ? !!api.IsIconic(hwnd) : false,
      exe: exe || null,
      app: exe ? path.win32.basename(String(exe)) : null,
    };
  }

  _isOwn(pid) {
    if (pid === process.pid) return true;
    try {
      return (this._ownPids() || []).includes(pid);
    } catch (_) {
      return false;
    }
  }

  _isChromium(desktop, w) {
    try {
      return new WindowObserver({ win: desktop.win, sleep: this._sleep }).isChromium(w);
    } catch (_) {
      return false;
    }
  }

  async _wake(desktop, hwnd) {
    try {
      const uia = typeof desktop.uia === 'function' ? desktop.uia() : null;
      if (uia && typeof uia.wake === 'function') await uia.wake(hwnd);
    } catch (_) {}
  }

  static defaultOwnPids() {
    try {
      const { app } = require('electron');
      return app && typeof app.getAppMetrics === 'function' ? app.getAppMetrics().map((m) => m.pid) : [];
    } catch (_) {
      return [];
    }
  }

  static _fail(error, code, status) {
    return { error, code, status };
  }

  static _safe(fn, fallback = null) {
    try { return fn(); } catch (_) { return fallback; }
  }
}

module.exports = WindowCapture;
