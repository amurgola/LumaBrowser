export default class ToolbarButton {
  static SVG_NS = 'http://www.w3.org/2000/svg';

  static create(container, extensionId, config) {
    const btn = document.createElement('button');
    btn.setAttribute('data-extension-id', extensionId);
    btn.setAttribute('title', config.tooltip || config.label || extensionId);
    btn.setAttribute('aria-label', config.label || extensionId);
    if (config.icon) ToolbarButton._renderIcon(btn, config.icon);
    else ToolbarButton._renderLabel(btn, config.label || extensionId);
    if (typeof config.onClick === 'function') btn.addEventListener('click', config.onClick);
    container.appendChild(btn);
    return btn;
  }

  static remove(container, extensionId) {
    const btn = [...container.querySelectorAll('button.toolbar-btn[data-extension-id]')]
      .find((el) => el.getAttribute('data-extension-id') === extensionId);
    if (btn) btn.remove();
  }

  static _renderIcon(btn, icon) {
    btn.className = 'toolbar-btn icon-btn';
    const svg = document.createElementNS(ToolbarButton.SVG_NS, 'svg');
    svg.setAttribute('class', 'icon');
    const use = document.createElementNS(ToolbarButton.SVG_NS, 'use');
    use.setAttribute('href', `#i-${icon}`);
    svg.appendChild(use);
    btn.appendChild(svg);
  }

  static _renderLabel(btn, label) {
    btn.className = 'toolbar-btn';
    btn.textContent = label;
  }
}
