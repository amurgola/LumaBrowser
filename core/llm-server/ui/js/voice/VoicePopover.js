export default class VoicePopover {
  static WIDTH_ROOM = 330;
  static LEFT_SHIFT = 150;
  static MARGIN = 8;
  static GAP = 10;
  static TOGGLE_BUTTONS = '.cm-mic, [data-tact="speak"]';

  constructor({ onClose = () => {} } = {}) {
    this._onClose = onClose;
    this.element = null;
  }

  get isOpen() {
    return !!this.element;
  }

  open(anchor, innerHtml) {
    this.close();
    if (!anchor) return null;
    const pop = document.createElement('div');
    pop.className = 'cm-voice-pop';
    pop.innerHTML = innerHtml;
    document.body.appendChild(pop);
    VoicePopover._position(pop, anchor);
    this.element = pop;
    setTimeout(() => this._armDismiss(pop), 0);
    return pop;
  }

  close() {
    this._onClose();
    if (!this.element) return;
    this.element.remove();
    this.element = null;
  }

  openNote(anchor, title, text) {
    return this.open(anchor, '<div class="cm-voice-pop-title">' + title + '</div><div class="cm-voice-pop-body">' + text + '</div>');
  }

  static _position(pop, anchor) {
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(VoicePopover.MARGIN, Math.min(window.innerWidth - VoicePopover.WIDTH_ROOM, r.left - VoicePopover.LEFT_SHIFT)) + 'px';
    pop.style.bottom = (window.innerHeight - r.top + VoicePopover.GAP) + 'px';
  }

  _armDismiss(pop) {
    const dismiss = (e) => {
      if (pop.contains(e.target)) return;
      if (e.target.closest && e.target.closest(VoicePopover.TOGGLE_BUTTONS)) return;
      document.removeEventListener('mousedown', dismiss);
      if (this.element === pop) this.close();
    };
    document.addEventListener('mousedown', dismiss);
  }
}
