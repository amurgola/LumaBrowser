import Dom from '../dom/Dom.js';

export default class ChatDock {
  static DOCK_KEY = 'luma.code.chatDock';
  static WIDTH_KEY = 'luma.code.chatDockWidth';
  static WIDTH_VAR = '--ce-chat-w';
  static MIN_WIDTH = 320;
  static EDITOR_MIN = 480;

  static wanted() {
    try { return localStorage.getItem(ChatDock.DOCK_KEY) !== '0'; } catch (_) { return true; }
  }

  static setWanted(on, button) {
    try { localStorage.setItem(ChatDock.DOCK_KEY, on ? '1' : '0'); } catch (_) {}
    ChatDock.paintButton(button);
    window.dispatchEvent(new CustomEvent('luma-code-dock'));
  }

  static paintButton(button) {
    if (!button) return;
    const on = ChatDock.wanted();
    button.classList.toggle('active', on);
    button.title = on ? 'Hide the conversation' : 'Show the conversation beside the editor';
  }

  static applyWidth(px) {
    if (px) document.body.style.setProperty(ChatDock.WIDTH_VAR, px + 'px');
    else document.body.style.removeProperty(ChatDock.WIDTH_VAR);
  }

  static clamp(width) {
    return Math.max(ChatDock.MIN_WIDTH, Math.min(width, window.innerWidth - ChatDock.EDITOR_MIN));
  }

  static buildGrip(onResized) {
    const grip = Dom.el('div', 'ce-dock-grip');
    grip.title = 'Drag to resize. Double-click to reset.';
    document.body.appendChild(grip);
    ChatDock._restoreWidth();
    ChatDock._wireDrag(grip, onResized);
    grip.addEventListener('dblclick', () => {
      try { localStorage.removeItem(ChatDock.WIDTH_KEY); } catch (_) {}
      ChatDock.applyWidth(0);
    });
    return grip;
  }

  static _restoreWidth() {
    let saved = 0;
    try { saved = parseInt(localStorage.getItem(ChatDock.WIDTH_KEY), 10) || 0; } catch (_) {}
    if (saved) ChatDock.applyWidth(ChatDock.clamp(saved));
  }

  static _wireDrag(grip, onResized) {
    let width = 0;
    grip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      grip.classList.add('dragging');
      document.body.classList.add('ce-dock-dragging');
    });
    grip.addEventListener('pointermove', (e) => {
      if (!grip.classList.contains('dragging')) return;
      width = ChatDock.clamp(window.innerWidth - e.clientX);
      ChatDock.applyWidth(width);
    });
    const end = () => {
      if (!grip.classList.contains('dragging')) return;
      grip.classList.remove('dragging');
      document.body.classList.remove('ce-dock-dragging');
      if (width) { try { localStorage.setItem(ChatDock.WIDTH_KEY, String(width)); } catch (_) {} }
      onResized();
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }
}
