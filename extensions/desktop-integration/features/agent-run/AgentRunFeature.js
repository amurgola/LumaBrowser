const ApprovalPresenter = require('./ApprovalPresenter');
const RunPresence = require('./RunPresence');
const TakeoverPresenter = require('./TakeoverPresenter');
const ChordHint = require('../hotkeys/ChordHint');
const HotkeyBindings = require('../hotkeys/HotkeyBindings');

class AgentRunFeature {
  static ACTIONS = [
    { id: 'pause', label: 'Pause or continue the desktop run', defaultBinding: 'Ctrl+Alt+Shift+Space', description: 'Holds the agent before its next desktop action; pressed again, it goes on.' },
    { id: 'stop', label: 'Stop the desktop run', defaultBinding: 'Ctrl+Alt+Shift+Escape', description: 'Stops desktop control at once and ends the agent\'s turn.' },
    { id: 'allow', label: 'Allow the waiting approval', defaultBinding: 'Ctrl+Alt+Shift+Y', description: 'Answers an approval question shown on the island with Allow (once); tells a waiting takeover you are done.' },
    { id: 'deny', label: 'Deny the waiting approval', defaultBinding: 'Ctrl+Alt+Shift+N', description: 'Answers an approval question shown on the island with Deny; skips the step a waiting takeover asked for.' },
  ];

  static BINDING_PREFIX = 'binding.';
  static REPEAT_MS = 400;
  static ATTACH_RETRY_MS = 1000;
  static ATTACH_TRIES = 120;
  static STATUS = { UNKNOWN_ACTION: 400, NO_APPROVAL: 409, NO_DESKTOP: 503, DISABLED: 503 };

  static settingsSchema() {
    const bindings = AgentRunFeature.ACTIONS.map((a) => ({
      key: AgentRunFeature.BINDING_PREFIX + a.id,
      label: a.label,
      type: 'hotkey',
      default: a.defaultBinding,
      help: `${a.description} Empty = no shortcut (REST and the island still work).`,
    }));
    return [
      ...bindings,
      { key: 'showRun', label: 'Show the run on the activity island', type: 'bool', default: true, help: 'While the agent clicks, types or scrolls in another app, the screen edge lights that window and the island says what is being done, with Pause and Stop.' },
      { key: 'showApprovals', label: 'Ask for approvals on the island', type: 'bool', default: true, help: 'When an agent waits for your approval, or for you to clear a login or CAPTCHA, and LumaBrowser is not the focused window, the question shows on the island with its answers instead of only a notification.' },
      { key: 'ring', label: 'Light the window being acted on', type: 'bool', default: true, help: 'The soft edge light around the window (or monitor) the agent is working on.' },
    ];
  }

  static defaultParts(deps = {}) {
    const electron = require('electron');
    const ExtensionGlobals = require('../../../../core/shell/extensions/ExtensionGlobals');
    return {
      globalShortcut: deps.shortcuts || electron.globalShortcut,
      getDesktop: () => global.__lumaDesktop || null,
      getRouter: () => ExtensionGlobals.chatRouter(),
    };
  }

  constructor(deps, parts) {
    this._deps = deps;
    this._parts = parts;
    this._now = parts.now || Date.now;
    this._st = parts.setTimeout || setTimeout;
    this._ct = parts.clearTimeout || clearTimeout;
    this._disposed = false;
    this._lastFire = new Map();
    this._desktop = null;
    this._unpresent = null;
    this._untakeover = null;
    this._unprogress = null;
    this._retry = null;
    this._tries = 0;
    const options = () => ({ show: deps.settings.get('showRun', true) !== false, ring: deps.settings.get('ring', true) !== false });
    this._presence = new RunPresence({
      overlay: deps.overlay || null,
      options,
      onAction: (id) => this.run(id, { via: 'island' }).catch(() => {}),
      onChange: (snapshot) => this._broadcast('run', snapshot),
      log: deps.log,
      setTimeout: this._st,
      clearTimeout: this._ct,
    });
    const questionOptions = () => ({ show: deps.settings.get('showApprovals', true) !== false, ring: deps.settings.get('ring', true) !== false });
    this._presenter = new ApprovalPresenter({
      overlay: deps.overlay || null,
      getRouter: () => this._router(),
      options: questionOptions,
      keys: () => this._keyLetters(),
      onChange: (pending) => this._broadcast('approval', { pending }),
      log: deps.log,
    });
    this._takeover = new TakeoverPresenter({
      overlay: deps.overlay || null,
      getRouter: () => this._router(),
      options: questionOptions,
      keys: () => this._keyLetters(),
      onChange: (pending) => this._broadcast('takeover', { pending }),
      log: deps.log,
    });
    this._bindings = new HotkeyBindings({ globalShortcut: parts.globalShortcut, onFire: (id) => this.fire(id), log: deps.log });
    this._unhint = null;
  }

  start() {
    this.applyBindings();
    if (this._deps.hints) this._unhint = this._deps.hints.add('agent-run', (context) => this.hintEntries(context));
    this.attach();
  }

  attach() {
    if (this._disposed) return false;
    const desktop = this._desktopService();
    if (desktop && this._desktop !== desktop) {
      this._desktop = desktop;
      this._presence.attach(desktop);
    }
    const router = this._router();
    if (router && !this._unpresent && typeof router.addApprovalPresenter === 'function') {
      try { this._unpresent = router.addApprovalPresenter(this._presenter); } catch (err) { this._deps.log.warn(`approval presenter not registered: ${(err && err.message) || err}`); }
    }
    if (router && !this._untakeover && typeof router.addTakeoverPresenter === 'function') {
      try { this._untakeover = router.addTakeoverPresenter(this._takeover); } catch (err) { this._deps.log.warn(`takeover presenter not registered: ${(err && err.message) || err}`); }
    }
    if (router && !this._unprogress && typeof router.onRunProgress === 'function') {
      try { this._unprogress = router.onRunProgress((p) => this._presence.onProgress(p)); } catch (err) { this._deps.log.warn(`run progress not subscribed: ${(err && err.message) || err}`); }
    }
    const done = !!this._desktop && !!this._unpresent;
    if (!done && this._tries < AgentRunFeature.ATTACH_TRIES) {
      this._tries += 1;
      this._retry = this._st(() => { this._retry = null; this.attach(); }, AgentRunFeature.ATTACH_RETRY_MS);
      if (this._retry && typeof this._retry.unref === 'function') this._retry.unref();
    }
    return done;
  }

  get presence() {
    return this._presence;
  }

  get presenter() {
    return this._presenter;
  }

  get takeover() {
    return this._takeover;
  }

  hintEntries() {
    const status = this._bindings.status();
    const entry = (id, label, note) => {
      const st = status[id];
      if (!st || !st.registered) return null;
      return { id: `agent-run.${id}`, accelerator: st.accelerator, label, note, run: () => this.run(id, { via: 'hint' }) };
    };
    const out = [];
    const pending = this._presenter.pending;
    const takeover = this._takeover.pending;
    if (pending) {
      out.push(entry('allow', 'Allow', pending.detail ? `Allow once: ${pending.detail}` : 'Allow the waiting approval'));
      out.push(entry('deny', 'Deny', 'Deny the waiting approval; the agent goes on without it'));
    } else if (takeover) {
      out.push(entry('allow', 'Done', takeover.detail ? `Tell the agent you are done: ${takeover.detail}` : 'Tell the agent you handled it'));
      out.push(entry('deny', 'Skip', 'Skip the step the agent asked you for; it goes on without it'));
      out.push(entry('stop', 'Stop', 'Stops the agent\'s turn'));
    } else if (this._presence.live) {
      const paused = this._presence.paused;
      out.push(entry('pause', paused ? 'Continue' : 'Pause', paused ? 'Lets the agent go on with its next desktop action' : 'Holds the agent before its next desktop action'));
      out.push(entry('stop', 'Stop', 'Stops desktop control now and ends the agent\'s turn'));
    }
    return out.filter(Boolean);
  }

  applyBindings() {
    const status = this._bindings.apply(this._readBindings());
    for (const [action, s] of Object.entries(status)) {
      if (s.error) this._deps.log.warn(`shortcut ${s.accelerator || '(none)'} for ${action} not registered: ${s.error}`);
    }
    return status;
  }

  fire(id) {
    if (this._deps.hints) this._deps.hints.dismiss();
    const now = this._now();
    if (this._lastFire.has(id) && now - this._lastFire.get(id) < AgentRunFeature.REPEAT_MS) return Promise.resolve({ success: false, code: 'REPEAT' });
    this._lastFire.set(id, now);
    return this.run(id, { via: 'hotkey' }).catch((err) => this._deps.log.error(`${id} crashed: ${(err && err.message) || err}`));
  }

  async run(id, source = {}) {
    if (this._disposed) return { success: false, error: 'The agent-run feature is off', code: 'DISABLED' };
    let result;
    if (id === 'pause') result = this.pause();
    else if (id === 'resume') result = this.resume();
    else if (id === 'stop') result = this.stop();
    else if (id === 'allow') result = this.answer('once');
    else if (id === 'deny') result = this.answer('reject');
    else result = { success: false, error: `Unknown action "${id}"`, code: 'UNKNOWN_ACTION' };
    this._broadcast('action', { action: id, via: source.via || null, success: !!result.success, code: result.code || null });
    return result;
  }

  pause() {
    const desktop = this._desktopService();
    if (!desktop) return AgentRunFeature._noDesktop();
    if (desktop.control.paused) return this.resume();
    desktop.control.pause();
    return { success: true, action: 'pause', paused: true };
  }

  resume() {
    const desktop = this._desktopService();
    if (!desktop) return AgentRunFeature._noDesktop();
    const resumed = desktop.control.resume();
    return { success: true, action: 'resume', paused: false, resumed };
  }

  stop() {
    const desktop = this._desktopService();
    if (!desktop) return AgentRunFeature._noDesktop();
    const wasLive = this._presence.live;
    desktop.control.stop();
    let aborted = false;
    const router = this._router();
    if (router && typeof router.abort === 'function') {
      try { router.abort(); aborted = true; } catch (err) { this._deps.log.warn(`abort failed: ${(err && err.message) || err}`); }
    }
    this._presence.showStopped();
    return { success: true, action: 'stop', aborted, wasLive };
  }

  answer(decision) {
    const d = String(decision || '');
    if (!['once', 'run', 'window', 'reject'].includes(d)) return { success: false, error: 'decision must be once, run, window or reject', code: 'UNKNOWN_ACTION' };
    const action = d === 'reject' ? 'deny' : 'allow';
    if (this._presenter.pending) return { success: this._presenter.answer(d), action, decision: d };
    if (this._takeover.pending) {
      const takeover = d === 'reject' ? 'skip' : 'continue';
      return { success: this._takeover.answer(takeover), action, decision: d, takeover };
    }
    const router = this._router();
    const taken = !!(router && typeof router.respondApproval === 'function' && router.respondApproval(d));
    if (taken) return { success: true, action, decision: d };
    const takeover = d === 'reject' ? 'skip' : 'continue';
    const handed = !!(router && typeof router.respondTakeover === 'function' && router.respondTakeover(takeover));
    if (handed) return { success: true, action, decision: d, takeover };
    return { success: false, error: 'No approval is waiting', code: 'NO_APPROVAL' };
  }

  describe() {
    const status = this._bindings.status();
    const desktop = this._desktopService();
    return {
      supported: !!(desktop && desktop.supported),
      desktopControl: !!(desktop && desktop.isEnabled()),
      run: this._presence.snapshot,
      stopped: !!(desktop && desktop.control.stopped),
      approval: this._presenter.pending,
      takeover: this._takeover.pending,
      actions: AgentRunFeature.ACTIONS.map((a) => {
        const s = status[a.id] || { accelerator: '', registered: false, error: null };
        return { id: a.id, label: a.label, description: a.description, binding: s.accelerator, registered: s.registered, conflict: s.error };
      }),
    };
  }

  mount(router) {
    router.get('/', (_req, res) => res.json({ success: true, ...this.describe() }));
    const act = (id) => async (req, res) => {
      const client = (typeof req.get === 'function' && req.get('X-Luma-Client')) || 'rest';
      const result = await this.run(id, { via: 'rest', client });
      res.status(result.success ? 200 : AgentRunFeature.statusFor(result.code)).json(result);
    };
    router.post('/pause', act('pause'));
    router.post('/resume', act('resume'));
    router.post('/stop', act('stop'));
    router.post('/approval', async (req, res) => {
      const result = this.answer(req.body && req.body.decision);
      this._broadcast('action', { action: 'approval', via: 'rest', success: !!result.success, code: result.code || null });
      res.status(result.success ? 200 : AgentRunFeature.statusFor(result.code)).json(result);
    });
  }

  onSettingsChanged(key) {
    if (String(key).startsWith(AgentRunFeature.BINDING_PREFIX)) this.applyBindings();
  }

  dispose() {
    this._disposed = true;
    if (this._retry) { this._ct(this._retry); this._retry = null; }
    if (this._unhint) this._unhint();
    for (const key of ['_unpresent', '_untakeover', '_unprogress']) {
      if (this[key]) { try { this[key](); } catch (_) {} this[key] = null; }
    }
    this._bindings.dispose();
    this._presenter.dispose();
    this._takeover.dispose();
    this._presence.dispose();
  }

  instance() {
    return {
      mount: (router) => this.mount(router),
      onSettingsChanged: (key, value) => this.onSettingsChanged(key, value),
      dispose: () => this.dispose(),
    };
  }

  static statusFor(code) {
    return AgentRunFeature.STATUS[code] || 500;
  }

  static _noDesktop() {
    return { success: false, error: 'Desktop control is not available', code: 'NO_DESKTOP' };
  }

  _readBindings() {
    const out = {};
    for (const a of AgentRunFeature.ACTIONS) {
      const value = this._deps.settings.get(AgentRunFeature.BINDING_PREFIX + a.id, a.defaultBinding);
      out[a.id] = value == null ? '' : String(value);
    }
    return out;
  }

  _keyLetters() {
    const status = this._bindings.status();
    const letter = (id) => {
      const st = status[id];
      const split = st && st.registered ? ChordHint.split(st.accelerator) : null;
      return split ? split.key : '';
    };
    return { allow: letter('allow'), deny: letter('deny'), stop: letter('stop') };
  }

  _desktopService() {
    try { return this._parts.getDesktop ? this._parts.getDesktop() : null; } catch (_) { return null; }
  }

  _router() {
    try { return this._parts.getRouter ? this._parts.getRouter() : null; } catch (_) { return null; }
  }

  _broadcast(type, payload) {
    try { this._deps.broadcast(type, payload); } catch (_) {}
  }
}

module.exports = AgentRunFeature;
