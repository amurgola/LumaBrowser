import GameStripMarkup from './GameStripMarkup.js';
import ComposerStrip from '../../../core/llm-server/ui/js/chat/composer/ComposerStrip.js';

export default class GameStrip extends ComposerStrip {
  static ORDER = 40;

  static CLASS_NAME = 'gm-strip';

  constructor(actions) {
    super(null, GameStrip.CLASS_NAME, GameStrip.ORDER);
    this._actions = actions;
    this._game = null;
    this._note = null;
    this._collapsed = true;
  }

  get mounted() {
    return !!(this._element && this._element.isConnected);
  }

  show(game) {
    this._game = game || null;
    this.paint();
  }

  reset() {
    this._game = null;
    this._note = null;
    this.unmount();
  }

  note(text, isErr) {
    this._note = { text: String(text || ''), isErr: !!isErr };
    this.paint();
  }

  html() {
    if (!GameStripMarkup.hasContent(this._game)) return '';
    return GameStripMarkup.html(this._game, { collapsed: this._collapsed, note: this._note });
  }

  onClick(event) {
    const button = ComposerStrip.target(event, 'data-gm');
    if (!button || button.disabled) return;
    const name = button.getAttribute('data-gm');
    if (name === 'collapse') {
      this._collapsed = !this._collapsed;
      this.paint();
      return;
    }
    const handler = this._actions[name];
    if (typeof handler === 'function') handler();
  }
}
