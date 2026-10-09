import CodeBuildPanel from './CodeBuildPanel.js';
import CodeKickoff from './CodeKickoff.js';

export default class CodeChatMode {
  static MODE_ID = 'code';

  static STYLESHEET_ID = 'cm-code-styles';

  static STYLESHEET_URL = '/llm-ui/ext/code-mode/code.css';

  static FILE_EVENTS = ['build:state', 'project:state'];

  constructor() {
    this._panel = new CodeBuildPanel();
  }

  register(registry) {
    CodeChatMode._linkStylesheet();
    registry.registerMode(this.hooks());
  }

  hooks() {
    return {
      id: CodeChatMode.MODE_ID,
      startConversation: (api, ctx, data) => CodeChatMode._sendKickoff(ctx, data),
      onOpenConversation: (meta) => {
        this._panel.setBuild(CodeChatMode._buildOf(meta));
        this._apply(meta);
      },
      applyTheme: (rootEl, meta) => this._apply(meta),
      onLeaveConversation: () => this._leave(),
      onChatEvent: (evt) => this._onChatEvent(evt),
      renderTurnExtras: () => {},
    };
  }

  _apply(meta) {
    this._panel.setBuild(CodeChatMode._buildOf(meta) || this._panel.build);
    this._render();
  }

  _leave() {
    this._panel.setLanes(null);
    this._panel.clear();
  }

  _onChatEvent(evt) {
    if (!evt) return;
    if (evt.type === 'batch:state') {
      this._panel.setLanes(evt.payload && Array.isArray(evt.payload.lanes) ? evt.payload.lanes : null);
    } else if (CodeChatMode.FILE_EVENTS.includes(evt.type)) {
      this._panel.setBuild(evt.payload || null);
    } else {
      return;
    }
    this._render();
  }

  _render() {
    this._panel.ensure();
    this._panel.render();
  }

  static _sendKickoff(ctx, data) {
    const msg = CodeKickoff.message(data);
    try { if (ctx && typeof ctx.sendTurn === 'function') ctx.sendTurn(msg); } catch (_) {}
  }

  static _buildOf(meta) {
    return (meta && meta.data && meta.data.build) || null;
  }

  static _linkStylesheet() {
    if (document.getElementById(CodeChatMode.STYLESHEET_ID)) return;
    const link = document.createElement('link');
    link.id = CodeChatMode.STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = CodeChatMode.STYLESHEET_URL;
    document.head.appendChild(link);
  }
}
