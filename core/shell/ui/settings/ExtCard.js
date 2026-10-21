import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class ExtCard {
  static OPEN_CLASS = 'is-open';

  static html(spec) {
    const esc = HtmlEscaper.escape;
    const open = !!spec.open;
    const classes = ['ext-item', 'ext-list-item'];
    if (spec.dim) classes.push('ext-list-item--disabled', 'is-dim');
    if (spec.error) classes.push('ext-list-item--error');
    if (open) classes.push(ExtCard.OPEN_CLASS);
    const hasTray = ExtCard._hasTray(spec);
    return `
      <div class="${classes.join(' ')}" data-card-id="${esc(spec.id)}" ${spec.attrs || ''}>
        <div class="ext-item-head">
          ${ExtCard._checkHtml(spec.check, spec.name)}
          ${ExtCard._iconHtml(spec)}
          <div class="ext-item-text ext-list-item-info"${hasTray ? ' data-card-fold' : ''}>
            <div class="ext-item-title">
              <span class="ext-item-name ext-list-item-name">${esc(spec.name)}</span>
              ${spec.version ? `<span class="ext-item-version ext-list-item-version">v${esc(spec.version)}</span>` : ''}
              ${spec.meta ? `<span class="ext-item-version">${esc(spec.meta)}</span>` : ''}
            </div>
            ${spec.summary ? `<div class="ext-item-summary ext-list-item-desc" title="${esc(spec.summary)}">${esc(spec.summary)}</div>` : ''}
          </div>
          ${ExtCard._statusHtml(spec)}
          ${spec.primary ? ExtCard._buttonHtml(spec.primary, 'luma-btn luma-btn--sm ext-item-primary') : ''}
          ${hasTray ? `<button type="button" class="ext-item-chev" data-card-fold aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} details for ${esc(spec.name)}" title="${open ? 'Hide' : 'Show'} details"><svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg></button>` : ''}
        </div>
        ${hasTray ? ExtCard._trayHtml(spec) : ''}
      </div>`;
  }

  static wireFolding(container, { onToggle = null } = {}) {
    if (!container || container._extCardWired) return;
    container._extCardWired = true;
    container.addEventListener('click', (e) => {
      const fold = e.target.closest && e.target.closest('[data-card-fold]');
      if (!fold || !container.contains(fold)) return;
      const card = fold.closest('.ext-item');
      if (!card) return;
      const open = card.classList.toggle(ExtCard.OPEN_CLASS);
      const chev = card.querySelector('.ext-item-chev');
      if (chev) {
        chev.setAttribute('aria-expanded', String(open));
        chev.title = open ? 'Hide details' : 'Show details';
      }
      if (onToggle) onToggle(card.dataset.cardId, open);
    });
  }

  static listHtml(cards) {
    return `<div class="ext-item-list ext-list-view">${cards.join('')}</div>`;
  }

  static _hasTray(spec) {
    return !!(spec.description || spec.error || (spec.details && spec.details.length) || spec.extraHtml || (spec.actions && spec.actions.length));
  }

  static _checkHtml(check, name) {
    if (!check) return '';
    const esc = HtmlEscaper.escape;
    const title = check.title || (check.checked ? `Active. Clear to turn ${name} off` : `Inactive. Check to turn ${name} on`);
    return `<input type="checkbox" class="ext-item-check ${check.cls || ''}" ${check.checked ? 'checked' : ''} ${check.disabled ? 'disabled' : ''} title="${esc(title)}" aria-label="${esc(`${name} active`)}">`;
  }

  static _iconHtml(spec) {
    const esc = HtmlEscaper.escape;
    if (spec.icon) return `<img class="ext-item-icon" src="${esc(spec.icon)}" alt="">`;
    const initial = String(spec.name || '?').trim().charAt(0).toUpperCase() || '?';
    return `<span class="ext-item-icon ext-item-initial" aria-hidden="true">${esc(initial)}</span>`;
  }

  static _statusHtml(spec) {
    const status = spec.status || (spec.error ? { text: 'Error', tone: 'bad' } : null);
    if (!status) return '';
    const tone = status.tone ? ` is-${status.tone}` : '';
    return `<span class="ext-item-status${tone}">${HtmlEscaper.escape(status.text)}</span>`;
  }

  static _buttonHtml(b, base) {
    const esc = HtmlEscaper.escape;
    const danger = b.danger ? ' danger' : '';
    return `<button type="button" class="${base}${danger} ${b.cls || ''}" ${b.disabled ? 'disabled' : ''}${b.title ? ` title="${esc(b.title)}"` : ''}>${esc(b.label)}</button>`;
  }

  static _trayHtml(spec) {
    const esc = HtmlEscaper.escape;
    const details = (spec.details || []).map((d) => `
              <div class="ext-item-detail"><span class="ext-item-detail-label">${esc(d.label)}</span><span class="ext-item-detail-value${d.mono ? ' is-mono' : ''}">${esc(d.value)}</span></div>`).join('');
    const actions = (spec.actions || []).map((a) => ExtCard._buttonHtml(a, 'luma-btn luma-btn--sm ext-item-action')).join('');
    return `
        <div class="ext-item-tray">
          <div class="ext-item-tray-inner">
            ${spec.error ? `<div class="ext-item-error ext-list-item-error">${esc(spec.error)}</div>` : ''}
            ${spec.description ? `<p class="ext-item-desc">${esc(spec.description)}</p>` : ''}
            ${details ? `<div class="ext-item-details">${details}</div>` : ''}
            ${spec.extraHtml || ''}
            ${actions ? `<div class="ext-item-actions">${actions}</div>` : ''}
          </div>
        </div>`;
  }
}
