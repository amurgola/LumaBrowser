import RuntimeRowHtml from './RuntimeRowHtml.js';

export default class RuntimeUpdateBadge {
  static apply(row, info, doc = document) {
    if (!row || !info) return;
    RuntimeUpdateBadge._state(row, info);
    RuntimeUpdateBadge._pill(row, info, doc);
  }

  static _state(row, info) {
    const slot = row.querySelector('[data-runtime-state]');
    if (!slot) return;
    const id = row.dataset.runtimeRow || '';
    if (info.updateAvailable) {
      slot.innerHTML = RuntimeRowHtml.installButton(id, 'Update', info.latest ? `Update ${info.current} → ${info.latest}` : 'Newer release available upstream');
      slot.classList.remove('is-current');
      return;
    }
    slot.textContent = 'Up to date';
    slot.classList.add('is-current');
    slot.title = info.current ? `Installed ${info.current} is the latest release` : '';
  }

  static _pill(row, info, doc) {
    const existing = row.querySelector('[data-update-pill]');
    if (existing) existing.remove();
    const head = row.querySelector('.runtime-head');
    if (!info.updateAvailable || !head) return;
    const pill = doc.createElement('span');
    pill.className = 'luma-badge';
    pill.setAttribute('data-update-pill', '');
    pill.textContent = 'Update available';
    pill.title = info.latest ? `Installed ${info.current} → ${info.latest}` : '';
    head.appendChild(pill);
  }
}
