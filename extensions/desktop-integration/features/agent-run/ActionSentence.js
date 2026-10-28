const DesktopCallText = require('../../../../core/llm-server/chat/approval/DesktopCallText');
const CardText = require('../../../../core/llm-server/chat/approval/CardText');

class ActionSentence {
  static TOOLS = { click: 'desktop_click', type: 'desktop_type', pressKey: 'desktop_press_key', scroll: 'desktop_scroll', launch: 'desktop_launch', focus: 'desktop_focus' };

  static of(event) {
    const e = event || {};
    const params = ActionSentence._params(e);
    const tool = ActionSentence.TOOLS[e.action];
    const describer = tool ? DesktopCallText.DESCRIBERS[tool] : null;
    if (describer) return describer(params);
    if (e.action === 'drag') return `Drag ${ActionSentence._where(params)}`;
    if (e.action === 'setValue') return `Set element ${params.ref} to "${CardText.clip(String(params.value == null ? '' : params.value), 40)}" ${ActionSentence._where(params)}`;
    return `${e.action || 'Act'} ${ActionSentence._where(params)}`;
  }

  static _params(e) {
    const args = { ...(e.args || {}) };
    delete args.hwnd;
    delete args.window;
    if (e.hwnd === 0) return { ...args, hwnd: 0 };
    return e.title ? { ...args, window: e.title } : args;
  }

  static _where(p) {
    if (p.hwnd === 0) return 'on the desktop';
    return p.window ? `in "${CardText.clip(p.window, 40)}"` : 'in a desktop window';
  }
}

module.exports = ActionSentence;
