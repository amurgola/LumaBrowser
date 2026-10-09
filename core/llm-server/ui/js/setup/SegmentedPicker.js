import HtmlEscaper from '../format/HtmlEscaper.js';

export default class SegmentedPicker {
  static _installed = new WeakSet();

  static html(id, options, current) {
    const esc = HtmlEscaper.escape;
    return `<div class="luma-segmented defaults-seg" role="radiogroup" data-seg-for="${esc(id)}">`
      + options.map((option) => SegmentedPicker._buttonHtml(option, current)).join('')
      + `</div><input type="hidden" id="${esc(id)}" value="${esc(current)}"/>`;
  }

  static install(doc) {
    if (!doc || SegmentedPicker._installed.has(doc)) return;
    SegmentedPicker._installed.add(doc);
    doc.addEventListener('click', (event) => SegmentedPicker._onClick(doc, event));
  }

  static _buttonHtml(option, current) {
    const esc = HtmlEscaper.escape;
    const on = String(option.id) === String(current);
    return `<button type="button" role="radio" aria-checked="${on}" class="${on ? 'active' : ''}" `
      + `data-seg-value="${esc(option.id)}"${option.title ? ` title="${esc(option.title)}"` : ''}>${esc(option.label)}</button>`;
  }

  static _onClick(doc, event) {
    const button = event.target.closest && event.target.closest('[data-seg-value]');
    if (!button || button.disabled) return;
    const group = button.closest('[data-seg-for]');
    const input = group && doc.getElementById(group.getAttribute('data-seg-for'));
    if (!input || input.value === button.getAttribute('data-seg-value')) return;
    input.value = button.getAttribute('data-seg-value');
    SegmentedPicker._markActive(group, button);
    input.dispatchEvent(new Event('change'));
  }

  static _markActive(group, active) {
    group.querySelectorAll('[data-seg-value]').forEach((button) => {
      const on = button === active;
      button.classList.toggle('active', on);
      button.setAttribute('aria-checked', String(on));
    });
  }
}
