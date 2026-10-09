export default class DockPanel {
  static TOGGLE_SLOTS = ['bottom-bar', 'right-panel'];

  static HIDDEN = 'ext-hidden';

  static isToggleSlot(slotName) {
    return DockPanel.TOGGLE_SLOTS.includes(slotName);
  }

  static toggle(container, extensionId, button) {
    const wrapper = [...container.querySelectorAll('[data-extension-id]')]
      .find((el) => el.getAttribute('data-extension-id') === extensionId);
    if (!wrapper) return;
    const wasHidden = wrapper.classList.contains(DockPanel.HIDDEN);
    wrapper.classList.toggle(DockPanel.HIDDEN, !wasHidden);
    container.classList.toggle(DockPanel.HIDDEN, !DockPanel._anyVisible(container));
    if (button && button.classList) button.classList.toggle('is-open', wasHidden);
  }

  static collapseIfEmpty(container) {
    if (!DockPanel._anyVisible(container)) container.classList.add(DockPanel.HIDDEN);
  }

  static _anyVisible(container) {
    return !!container.querySelector(`[data-slot-content]:not(.${DockPanel.HIDDEN})`);
  }
}
