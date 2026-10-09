import HtmlEscaper from '../../format/HtmlEscaper.js';
import SegmentedPicker from '../../setup/SegmentedPicker.js';

export default class DefaultsRows {
  constructor() {
    this._openHelp = new Set();
  }

  isHelpOpen(id) {
    return this._openHelp.has(id);
  }

  handleClick(target, doc) {
    const toggle = target.closest('[data-help-for]');
    if (!toggle) return false;
    const id = toggle.getAttribute('data-help-for');
    const open = this._openHelp.has(id);
    if (open) this._openHelp.delete(id); else this._openHelp.add(id);
    const box = doc.getElementById(id + 'Help');
    if (box) box.hidden = open;
    toggle.setAttribute('aria-expanded', String(!open));
    return true;
  }

  select(id, label, options, help, attrs = '') {
    return `
                <div class="defaults-row">
                    <label for="${id}">${label}</label>
                    <select id="${id}" ${attrs}>${options}</select>
                    ${this._helpPair(id, help, true)}
                </div>`;
  }

  text(id, label, value, placeholder, help) {
    const esc = HtmlEscaper.escape;
    return `
                <div class="defaults-row">
                    <label for="${id}">${label}</label>
                    <input type="text" id="${id}" class="defaults-mono-input" spellcheck="false" autocomplete="off"
                        value="${esc(value || '')}" placeholder="${esc(placeholder || '')}"
                        style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;"/>
                    ${this._helpPair(id, help, true)}
                </div>`;
  }

  segmented(id, label, options, current, help) {
    return `
                <div class="defaults-row">
                    <label>${label}</label>
                    <div class="defaults-seg-slot">${SegmentedPicker.html(id, options, current)}</div>
                    ${this._helpPair(id, help, true)}
                </div>`;
  }

  toggle(id, label, checked, caption, help) {
    return `
                <div class="defaults-opt">
                    <label class="defaults-opt-main" for="${id}">
                        <span class="luma-switch">
                            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}/>
                            <span class="luma-switch-track"></span>
                        </span>
                        <span class="defaults-opt-text">
                            <span class="defaults-opt-name">${label}</span>
                            <span class="defaults-opt-cap">${caption}</span>
                        </span>
                    </label>
                    ${this._helpPair(id, help, false)}
                </div>`;
  }

  _helpPair(id, help, spacer) {
    if (!help) return spacer ? '<span class="defaults-help-spacer"></span>' : '';
    const open = this._openHelp.has(id);
    return `<button type="button" class="defaults-help-btn" data-help-for="${id}" aria-expanded="${open}" aria-controls="${id}Help" title="What does this do?">?</button>`
      + `\n                    <div class="defaults-help" id="${id}Help" ${open ? '' : 'hidden'}>${help}</div>`;
  }
}
