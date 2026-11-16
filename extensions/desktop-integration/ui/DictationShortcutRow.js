import ShortcutCapture from './ShortcutCapture.js';

export default class DictationShortcutRow {
  static STATUS_CHANNEL = 'ext.desktop-integration.hotkeys.dictation';
  static SAVE_CHANNEL = 'ext.desktop-integration.setFeatureSetting';
  static CHANGED_CHANNEL = 'ext.desktop-integration.changed';
  static FEATURE_ID = 'hotkeys';
  static SETTING_KEY = 'binding.dictate';
  static HOST_ID = 'generalSettings';
  static SECTION_ID = 'gsSecDictation';
  static UNSET_LABEL = 'Set a shortcut';
  static CAPTURE_LABEL = 'Press the keys...';

  static SECTION_HTML = `
    <h4 class="gs-subsection-title">Dictation</h4>
    <div class="gs-body">
      <div class="gs-row">
        <div class="gs-row-text">
          <span class="gs-row-label">Dictation shortcut</span>
          <span class="gs-row-help">Press it in any app, speak, and press it again: what you said is typed into the text box you are in. Works in LumaBrowser too.</span>
        </div>
        <div class="gs-row-control">
          <button type="button" class="gs-action-btn" id="gsDictationKey" aria-label="Dictation shortcut"></button>
          <button type="button" class="gs-action-btn gs-quiet-btn" id="gsDictationClear">Clear</button>
        </div>
        <div class="gs-row-error" id="gsDictationNote" role="status" aria-live="polite" hidden></div>
      </div>
    </div>
  `;

  constructor({ doc = null, mac = null } = {}) {
    this._doc = doc;
    this._mac = mac;
    this._ipc = null;
    this._section = null;
    this._els = {};
    this._binding = '';
    this._capturing = false;
    this._detach = [];
  }

  activate(ipc) {
    const doc = this._document();
    const host = doc && doc.getElementById(DictationShortcutRow.HOST_ID);
    if (!ipc || !host || this._section) return;
    this._ipc = ipc;
    this._section = this._mount(doc, host);
    this._wire(doc);
    this.refresh();
  }

  deactivate() {
    for (const detach of this._detach) { try { detach(); } catch (_) {} }
    this._detach = [];
    if (this._section) this._section.remove();
    this._section = null;
    this._ipc = null;
    this._capturing = false;
  }

  async refresh() {
    if (!this._section) return;
    const status = await this._status();
    if (!this._section) return;
    const usable = !!(status && status.success !== false && status.supported && status.ready);
    DictationShortcutRow._show(this._section, usable);
    if (!usable) return;
    this._binding = status.binding || '';
    this._paint(status.binding && !status.registered ? `${ShortcutCapture.display(status.binding)} is not active: ${status.conflict || 'it could not be registered'}.` : '');
  }

  _document() {
    return this._doc || (typeof document === 'undefined' ? null : document);
  }

  _mount(doc, host) {
    const section = doc.createElement('section');
    section.className = 'gs-subsection';
    section.id = DictationShortcutRow.SECTION_ID;
    section.innerHTML = DictationShortcutRow.SECTION_HTML;
    DictationShortcutRow._show(section, false);
    host.appendChild(section);
    this._els = {
      key: section.querySelector('#gsDictationKey'),
      clear: section.querySelector('#gsDictationClear'),
      note: section.querySelector('#gsDictationNote'),
    };
    return section;
  }

  _wire(doc) {
    const { key, clear } = this._els;
    key.addEventListener('click', () => this._startCapture());
    key.addEventListener('keydown', (event) => this._onKey(event));
    key.addEventListener('blur', () => this._stopCapture());
    clear.addEventListener('click', () => this._save(''));
    const onOpen = () => this.refresh();
    doc.addEventListener('settings:open', onOpen);
    this._detach.push(() => doc.removeEventListener('settings:open', onOpen));
    const off = typeof this._ipc.on === 'function' ? this._ipc.on(DictationShortcutRow.CHANGED_CHANNEL, () => { if (!this._capturing) this.refresh(); }) : null;
    if (typeof off === 'function') this._detach.push(off);
  }

  _startCapture() {
    this._capturing = true;
    this._paint('');
  }

  _stopCapture() {
    if (!this._capturing) return;
    this._capturing = false;
    this._paint('');
  }

  _onKey(event) {
    if (!this._capturing) return;
    event.preventDefault();
    event.stopPropagation();
    const bare = !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    if (bare && event.key === 'Escape') {
      this._stopCapture();
      return;
    }
    const read = ShortcutCapture.read(event, { mac: this._isMac() });
    if (read.accelerator) {
      this._capturing = false;
      this._save(read.accelerator);
    } else if (read.error) {
      this._paint(read.error);
    } else {
      this._els.key.textContent = read.pending ? `${ShortcutCapture.display(read.pending)} + ...` : DictationShortcutRow.CAPTURE_LABEL;
    }
  }

  async _save(accelerator) {
    let failure = '';
    try {
      const reply = await this._ipc.invoke(DictationShortcutRow.SAVE_CHANNEL, DictationShortcutRow.FEATURE_ID, DictationShortcutRow.SETTING_KEY, accelerator);
      if (reply && reply.success === false) failure = reply.error || 'Could not save the shortcut';
    } catch (err) {
      failure = (err && err.message) || 'Could not save the shortcut';
    }
    await this.refresh();
    if (failure) this._paint(failure);
    else this._markSaved();
  }

  _markSaved() {
    const mark = typeof window === 'undefined' ? null : window.gsMarkSaved;
    if (typeof mark === 'function') mark(this._els.key, true);
  }

  async _status() {
    try {
      return await this._ipc.invoke(DictationShortcutRow.STATUS_CHANNEL);
    } catch (_) {
      return null;
    }
  }

  _paint(note) {
    const { key, clear, note: noteEl } = this._els;
    key.textContent = this._capturing ? DictationShortcutRow.CAPTURE_LABEL : (ShortcutCapture.display(this._binding) || DictationShortcutRow.UNSET_LABEL);
    key.title = this._capturing ? 'Press Esc to keep the current shortcut' : 'Click, then press a key or a combination';
    DictationShortcutRow._show(clear, !!this._binding && !this._capturing);
    noteEl.textContent = note || '';
    DictationShortcutRow._show(noteEl, !!note);
  }

  static _show(element, visible) {
    element.hidden = !visible;
    element.style.display = visible ? '' : 'none';
  }

  _isMac() {
    if (this._mac !== null) return this._mac;
    return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '');
  }
}
