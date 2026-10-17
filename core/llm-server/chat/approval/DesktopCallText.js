const CardText = require('./CardText');

class DesktopCallText {
  static launch(p) {
    const args = p.args ? ` with ${CardText.clip(p.args, 80)}` : '';
    return `Open ${CardText.clip(p.app, 60)}${args} on your desktop`;
  }

  static click(p) {
    const what = p.description ? `"${CardText.clip(p.description, 60)}"` : p.ref != null ? `element ${p.ref}` : `the point ${p.x}, ${p.y}`;
    return `${p.double ? 'Double-click' : 'Click'} ${what} ${DesktopCallText._where(p)}`;
  }

  static type(p) {
    const text = String(p.text == null ? '' : p.text);
    return `Type "${CardText.clip(text, 60)}"${p.submit ? ' and press Enter' : ''} ${DesktopCallText._where(p)}`;
  }

  static pressKey(p) {
    return `Press ${CardText.clip(p.keys, 30)} ${DesktopCallText._where(p)}`;
  }

  static scroll(p) {
    const over = p.description ? ` over "${CardText.clip(p.description, 50)}"` : '';
    return `Scroll ${p.direction || 'down'}${over} ${DesktopCallText._where(p)}`;
  }

  static _where(p) {
    if (p.hwnd != null && Number(p.hwnd) === 0) return 'on the desktop';
    if (p.window) return `in "${CardText.clip(p.window, 40)}"`;
    return p.hwnd != null ? `in window ${p.hwnd}` : 'in a desktop window';
  }

  static DESCRIBERS = Object.freeze({
    desktop_launch: (p) => DesktopCallText.launch(p),
    desktop_click: (p) => DesktopCallText.click(p),
    desktop_type: (p) => DesktopCallText.type(p),
    desktop_press_key: (p) => DesktopCallText.pressKey(p),
    desktop_scroll: (p) => DesktopCallText.scroll(p),
    desktop_focus: (p) => `Bring a window to the front (${DesktopCallText._where(p).replace(/^in /, '')})`,
  });
}

module.exports = DesktopCallText;
