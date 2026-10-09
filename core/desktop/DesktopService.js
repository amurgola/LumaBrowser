const path = require('path');
const AntiCheatDetector = require('./AntiCheatDetector');
const DesktopError = require('./DesktopError');
const DesktopKeys = require('./DesktopKeys');
const Win32 = require('./Win32');
const DesktopClickLadder = require('./service/DesktopClickLadder');
const DesktopDrag = require('./service/DesktopDrag');
const DesktopGuards = require('./service/DesktopGuards');
const DesktopKeyboard = require('./service/DesktopKeyboard');
const DesktopScroll = require('./service/DesktopScroll');
const DesktopTyping = require('./service/DesktopTyping');
const GuardedInput = require('./service/GuardedInput');
const PointerClicker = require('./service/PointerClicker');
const RefLocator = require('./service/RefLocator');
const ScreenFrames = require('./service/ScreenFrames');
const ScreenshotImage = require('./service/ScreenshotImage');
const UiaObservation = require('./service/UiaObservation');
const WindowObserver = require('./service/WindowObserver');

class DesktopService {
  static ENABLED_KEY = 'core.desktop.enabled';
  static MAX_EDGE = ScreenshotImage.MAX_EDGE;
  static HUMAN_NEEDED = DesktopError.HUMAN_NEEDED;
  static COVERED = DesktopError.COVERED;
  static FOCUS_SETTLE_MS = 150;
  static ALREADY_FRONT_SETTLE_MS = 20;

  constructor({ db, nativeImage, visualGrounding = null, uia = null, win = Win32, clipboard = null, sleep = DesktopService._realSleep } = {}) {
    this.win = win;
    this._db = db;
    this._nativeImage = nativeImage;
    this._uia = uia;
    this._sleep = sleep;
    this._guards = new DesktopGuards(win);
    this._input = new GuardedInput({ win, guards: this._guards });
    this._frames = new ScreenFrames();
    this._observation = new UiaObservation();
    this._observer = new WindowObserver({ win, sleep });
    this._keyboard = new DesktopKeyboard({ win, input: this._input, sleep });
    this._buildActions({ visualGrounding, clipboard });
  }

  get supported() {
    return process.platform === 'win32';
  }

  isEnabled() {
    return !!(this._db && this._db.get(DesktopService.ENABLED_KEY, false));
  }

  setEnabled(on) {
    this._db.set(DesktopService.ENABLED_KEY, !!on);
  }

  uia() {
    if (!this._uia) this._uia = new (require('./uia/UiaHost'))();
    return this._uia;
  }

  shutdown() {
    if (this._uia) this._uia.close();
  }

  gate() {
    if (!this.supported) return 'Desktop control is only available on Windows for now.';
    if (!this.isEnabled()) return 'Desktop control is turned off. The user can enable "Allow desktop control" in the LLM tab (Visual grounding card).';
    return null;
  }

  resolve({ hwnd, window: title } = {}) {
    if (hwnd == null && !title) return { error: 'hwnd or window (title text) is required. Call desktop_list_windows first.' };
    const found = hwnd != null ? this._byHwnd(hwnd) : this._byTitle(title);
    if (found.error) return found;
    if (!found.w) return { error: `No such window (${hwnd != null ? `hwnd ${hwnd}` : `"${title}"`}). It may have closed; call desktop_list_windows.` };
    if (found.w.pid === process.pid) return { error: 'That is a LumaBrowser window. Use the browser tools for it.' };
    return found;
  }

  inputRefusal(w) {
    return this._guards.inputRefusal(w);
  }

  async bringToFront(w) {
    const api = this.win.load();
    const already = typeof api.GetForegroundWindow === 'function' && api.GetForegroundWindow() === w.hwnd;
    if (!this.win.focusWindow(w.hwnd)) return false;
    await this._sleep(already ? DesktopService.ALREADY_FRONT_SETTLE_MS : DesktopService.FOCUS_SETTLE_MS);
    return true;
  }

  send(w, inputs) {
    return this._input.send(w, inputs);
  }

  capture(w) {
    if (!w) {
      const rect = this.win.virtualScreen();
      return { rect, shot: this.win.captureBGRA({ rect }), method: 'screen' };
    }
    if (w.minimized) throw new Error(`"${w.title}" is minimized; call desktop_focus first.`);
    const shot = this.win.captureBGRA({ hwnd: w.hwnd, rect: w.rect });
    if (this.win.isBlank(shot.bgra)) return { rect: w.rect, shot: this.win.captureBGRA({ rect: w.rect }), method: 'screen-region' };
    return { rect: w.rect, shot, method: 'window' };
  }

  listWindows() {
    const gate = this.gate();
    if (gate) return { success: false, error: gate };
    const windows = this.win.listTopLevelWindows().filter((w) => w.pid !== process.pid).map((w) => this._describeWindow(w));
    const human = this._guards.humanNeeded();
    return { success: true, data: { windows, ...(human ? { humanNeeded: human.message } : {}) } };
  }

  focus(args) {
    const { w, result } = this._target(args);
    if (result) return result;
    const refusal = this._guards.promptRefusal(w) || this._guards.humanNeeded();
    if (refusal) return DesktopError.toResult(refusal);
    return this.win.focusWindow(w.hwnd)
      ? { success: true, data: { hwnd: w.hwnd, title: w.title } }
      : { success: false, error: `Windows refused to bring "${w.title}" to the front.` };
  }

  screenshot(args = {}) {
    const gate = this.gate();
    if (gate) return { success: false, error: gate };
    const target = args.hwnd != null || args.window ? this.resolve(args) : { w: null };
    if (target.error) return { success: false, error: target.error };
    try {
      return this._screenshotOf(target.w);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async observe(args = {}) {
    const { w, result } = this._target(args);
    if (result) return result;
    try {
      const { nodes, truncated } = await this._observer.read(this.uia(), w, args.maxNodes || WindowObserver.DEFAULT_MAX_NODES);
      this._observation.record(w.hwnd, nodes);
      return { success: true, data: { text: WindowObserver.describe(w, nodes, truncated), count: nodes.length } };
    } catch (e) {
      return { success: false, error: `UI Automation failed: ${e.message}` };
    }
  }

  async click(args = {}) {
    const { w, result } = this._target(args);
    return result || this._clickLadder.click(w, args);
  }

  async type(args = {}) {
    const { w, result } = this._target(args);
    return result || this._typing.type(w, args);
  }

  async pressKey(args = {}) {
    const { w, result } = this._target(args);
    if (result) return result;
    try {
      DesktopKeys.comboEvents(args.keys);
      this._guards.preInput(w);
      if (!(await this.bringToFront(w))) return { success: false, error: `Could not bring "${w.title}" to the front.` };
      await this._keyboard.combo(w, args.keys);
      return { success: true, data: { keys: args.keys } };
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  async scroll(args = {}) {
    const { w, result } = this._target(args);
    return result || this._scroll.scroll(w, args);
  }

  async drag(args = {}) {
    const { w, result } = this._target(args);
    return result || this._drag.drag(w, args);
  }

  async setValue(args = {}) {
    const { w, result } = this._target(args);
    if (result) return result;
    const invalid = this._setValueProblem(w, args);
    if (invalid) return { success: false, error: invalid };
    const refusal = this._guards.targetRefusal(w);
    if (refusal) return DesktopError.toResult(refusal);
    try {
      return await this._setRange(Number(args.ref), typeof args.value === 'number' ? args.value : String(args.value));
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  _buildActions({ visualGrounding, clipboard }) {
    const parts = {
      win: this.win,
      nativeImage: this._nativeImage,
      visualGrounding,
      clipboard,
      guards: this._guards,
      input: this._input,
      keyboard: this._keyboard,
      frames: this._frames,
      observation: this._observation,
      sleep: this._sleep,
      uia: () => this.uia(),
      bringToFront: (w) => this.bringToFront(w),
      capture: (w) => this.capture(w),
    };
    parts.locator = new RefLocator(parts);
    parts.pointer = new PointerClicker(parts);
    this._clickLadder = new DesktopClickLadder(parts);
    this._typing = new DesktopTyping(parts);
    this._scroll = new DesktopScroll(parts);
    this._drag = new DesktopDrag(parts);
  }

  _target(args = {}) {
    const gate = this.gate();
    if (gate) return { result: { success: false, error: gate } };
    const { w, error } = this.resolve(args);
    return error ? { result: { success: false, error } } : { w };
  }

  _byHwnd(hwnd) {
    return { w: this.win.listTopLevelWindows().find((x) => x.hwnd === Number(hwnd)) || null };
  }

  _byTitle(title) {
    const t = String(title).toLowerCase();
    const hits = this.win.listTopLevelWindows().filter((x) => x.title.toLowerCase().includes(t));
    if (hits.length > 1) {
      return { error: `"${title}" matches ${hits.length} windows (${hits.slice(0, 5).map((x) => `${x.hwnd} "${x.title}"`).join(', ')}). Pass hwnd.` };
    }
    return { w: hits[0] || null };
  }

  _describeWindow(w) {
    const exe = this.win.processImagePath(w.pid);
    const antiCheat = AntiCheatDetector.detect(exe);
    const elevated = this.win.isElevated(w.pid);
    const prompt = this._guards.systemPromptOf(w.hwnd, { className: w.className, pid: w.pid });
    return {
      hwnd: w.hwnd,
      title: w.title,
      app: exe ? path.basename(exe) : null,
      rect: w.rect,
      minimized: w.minimized,
      ...(elevated ? { elevated: true } : {}),
      ...(antiCheat ? { antiCheat } : {}),
      ...(prompt ? { systemPrompt: prompt.kind } : {}),
    };
  }

  _screenshotOf(w) {
    const { rect, shot, method } = this.capture(w);
    const image = ScreenshotImage.fromShot(this._nativeImage, shot);
    const size = image.getSize();
    const frame = { hwnd: w ? w.hwnd : 0, screen: rect, imageWidth: size.width, imageHeight: size.height };
    this._frames.record(frame);
    return {
      success: true,
      data: { screenshot: image.toPNG().toString('base64'), mimeType: 'image/png', frame, method, title: w ? w.title : 'desktop' },
    };
  }

  _setValueProblem(w, args) {
    if (args.ref == null) return 'ref is required (a slider, spinner or field from desktop_observe).';
    if (args.value == null || args.value === '') return 'value is required.';
    if (!this._observation.isFor(w.hwnd)) return UiaObservation.NOT_OBSERVED;
    return null;
  }

  async _setRange(ref, value) {
    const r = await this.uia().act(ref, 'setRange', value);
    return {
      success: true,
      data: {
        method: `uia:${r.done}`,
        ref,
        ...(r.value !== undefined ? { value: r.value } : {}),
        ...(r.min !== undefined ? { min: r.min, max: r.max } : {}),
      },
    };
  }

  static _realSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = DesktopService;
