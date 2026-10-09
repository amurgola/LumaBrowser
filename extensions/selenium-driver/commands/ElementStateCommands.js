const WebDriverCommandGroup = require('./WebDriverCommandGroup');

class ElementStateCommands extends WebDriverCommandGroup {
  commandNames() {
    return [
      'elementText', 'elementTagName', 'elementAttribute', 'elementProperty', 'elementCss',
      'elementRect', 'elementEnabled', 'elementSelected', 'elementComputedRole', 'elementComputedLabel',
    ];
  }

  async elementText(session, params) {
    return this._elements.readAttached(session, params['element id'],
      "return el ? (el.innerText || el.textContent || '') : null;");
  }

  async elementTagName(session, params) {
    return this._elements.readAttached(session, params['element id'], 'return el ? el.tagName.toLowerCase() : null;');
  }

  async elementAttribute(session, params) {
    return this._elements.read(session, params['element id'],
      `return el ? el.getAttribute(${JSON.stringify(params.name)}) : null;`);
  }

  async elementProperty(session, params) {
    return this._elements.read(session, params['element id'],
      `if (!el) return null; try { return el[${JSON.stringify(params.name)}]; } catch { return null; }`);
  }

  async elementCss(session, params) {
    return this._elements.read(session, params['element id'],
      `if (!el) return null; return getComputedStyle(el).getPropertyValue(${JSON.stringify(params['property name'])});`);
  }

  async elementRect(session, params) {
    return this._elements.readAttached(session, params['element id'],
      'if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height };');
  }

  async elementEnabled(session, params) {
    return this._elements.read(session, params['element id'], 'return !!el && !el.disabled;');
  }

  async elementSelected(session, params) {
    return this._elements.read(session, params['element id'], `
      if (!el) return false;
      if (el.type === 'checkbox' || el.type === 'radio') return !!el.checked;
      if (el.tagName === 'OPTION') return !!el.selected;
      return false;`);
  }

  async elementComputedRole(session, params) {
    return this._elements.read(session, params['element id'], "return el ? (el.getAttribute('role') || '') : '';");
  }

  async elementComputedLabel(session, params) {
    return this._elements.read(session, params['element id'], `
      if (!el) return '';
      return (el.getAttribute('aria-label')
        || (el.labels && el.labels[0] && el.labels[0].textContent.trim())
        || el.getAttribute('alt')
        || el.getAttribute('title')
        || '');`);
  }
}

module.exports = ElementStateCommands;
