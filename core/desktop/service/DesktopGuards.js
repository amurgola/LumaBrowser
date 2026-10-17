const AntiCheatDetector = require('../AntiCheatDetector');
const SystemPromptDetector = require('../SystemPromptDetector');
const DesktopError = require('../DesktopError');

class DesktopGuards {
  constructor(win) {
    this._win = win;
  }

  inputRefusal(w) {
    const exe = this._win.processImagePath(w.pid);
    const antiCheat = AntiCheatDetector.detect(exe);
    if (antiCheat) {
      return `Refusing to send input to "${w.title}": it is protected by ${antiCheat}. Automated input there is treated as cheating and can get the user's account banned.`;
    }
    if (this._win.isElevated(w.pid)) {
      return `"${w.title}" runs as administrator. Windows blocks input from a normal app to an elevated one, so the click would silently do nothing.`;
    }
    return null;
  }

  systemPromptOf(hwnd, known = {}) {
    const className = known.className !== undefined ? known.className : DesktopGuards._safe(() => this._win.className(hwnd));
    const pid = known.pid !== undefined ? known.pid : DesktopGuards._safe(() => this._win.processIdOf(hwnd).pid);
    const exe = pid ? DesktopGuards._safe(() => this._win.processImagePath(pid)) : null;
    return SystemPromptDetector.detect({ exe, className });
  }

  promptRefusal(w) {
    const prompt = this.systemPromptOf(w.hwnd, { className: w.className, pid: w.pid });
    if (!prompt) return null;
    return new DesktopError(`"${w.title}" is a ${prompt.label}. Only the user may answer it: ask them to, then try again.`, DesktopError.HUMAN_NEEDED);
  }

  targetRefusal(w) {
    if (w.desktop) return null;
    const prompt = this.promptRefusal(w);
    if (prompt) return prompt;
    const refusal = this.inputRefusal(w);
    return refusal ? new DesktopError(refusal, DesktopError.REFUSED) : null;
  }

  humanNeeded() {
    return this._secureDesktop() || this._promptInFront();
  }

  checkForeground(w) {
    if (w.desktop) {
      this.checkDesktop(w);
      return;
    }
    const api = this._win.load();
    if (typeof api.GetForegroundWindow !== 'function') return;
    const fg = api.GetForegroundWindow();
    if (!fg || fg === w.hwnd) return;
    const other = DesktopGuards._safe(() => this._win.windowText(fg), '');
    const titled = other ? ` ("${other}")` : '';
    const prompt = this.systemPromptOf(fg);
    if (prompt) {
      throw new DesktopError(`Stopped: a ${prompt.label}${titled} took the foreground while acting on "${w.title}". Nothing more was sent. Only the user may answer it: ask them to, then try again.`, DesktopError.HUMAN_NEEDED);
    }
    if (this._isOwnPopup(fg, w)) return { hwnd: fg, title: other };
    throw new DesktopError(`Stopped: another window took the foreground${titled} while acting on "${w.title}". Nothing more was sent to it.`, DesktopError.FOREGROUND_CHANGED);
  }

  _isOwnPopup(fg, w) {
    if (typeof this._win.popupInfo !== 'function') return false;
    const info = DesktopGuards._safe(() => this._win.popupInfo(fg));
    if (!info) return false;
    if (info.rootOwner === w.hwnd) return true;
    if (!info.toolWindow || !w.pid) return false;
    return DesktopGuards._safe(() => this._win.processIdOf(fg).pid) === w.pid;
  }

  checkDesktop(w) {
    const at = w.point ? DesktopGuards._safe(() => this._win.rootWindowAt(w.point.sx, w.point.sy)) : this._foregroundInfo();
    const refusal = this.landingRefusal(at, w.point ? 'under the pointer' : 'in front');
    if (refusal) throw refusal;
  }

  landingRefusal(at, where) {
    if (!at || !at.hwnd) return null;
    if (at.pid === process.pid) {
      return new DesktopError(`LumaBrowser is the window ${where}, and desktop control never sends input to itself. Use desktop_click / desktop_type with the target window's hwnd so it is brought to the front first.`, DesktopError.REFUSED);
    }
    return this.targetRefusal({ ...at, title: at.title || at.className || `hwnd ${at.hwnd}` });
  }

  preInput(w) {
    const refusal = this.targetRefusal(w);
    if (refusal) throw refusal;
    const human = this.humanNeeded();
    if (human) throw human;
    if (w.desktop) this.checkDesktop(w);
  }

  foregroundWindow() {
    return this._foregroundInfo();
  }

  _secureDesktop() {
    if (typeof this._win.inputDesktopName !== 'function') return null;
    const name = this._inputDesktopName();
    if (name != null && String(name).toLowerCase() === 'default') return null;
    const which = name ? `the "${name}" desktop` : 'the secure desktop';
    return new DesktopError(
      `Windows is showing a secure screen (${which}): a User Account Control prompt, the lock screen or the Ctrl+Alt+Del screen. No app can click or type there. Ask the user to deal with it, then try again.`,
      DesktopError.HUMAN_NEEDED,
    );
  }

  _inputDesktopName() {
    try { return this._win.inputDesktopName(); } catch (_) { return 'Default'; }
  }

  _promptInFront() {
    const api = DesktopGuards._safe(() => this._win.load(), {});
    const fg = typeof api.GetForegroundWindow === 'function' ? DesktopGuards._safe(() => api.GetForegroundWindow()) : null;
    if (!fg) return null;
    const prompt = this.systemPromptOf(fg);
    if (!prompt) return null;
    const title = DesktopGuards._safe(() => this._win.windowText(fg), '');
    return new DesktopError(`A ${prompt.label}${title ? ` ("${title}")` : ''} is open in front. Only the user may answer it: ask them to, then try again.`, DesktopError.HUMAN_NEEDED);
  }

  _foregroundInfo() {
    const api = DesktopGuards._safe(() => this._win.load(), {});
    const fg = typeof api.GetForegroundWindow === 'function' ? DesktopGuards._safe(() => api.GetForegroundWindow()) : null;
    if (!fg) return null;
    return {
      hwnd: fg,
      title: DesktopGuards._safe(() => this._win.windowText(fg), ''),
      className: DesktopGuards._safe(() => this._win.className(fg)),
      pid: DesktopGuards._safe(() => this._win.processIdOf(fg).pid),
    };
  }

  static _safe(fn, fallback = null) {
    try { return fn(); } catch (_) { return fallback; }
  }
}

module.exports = DesktopGuards;
