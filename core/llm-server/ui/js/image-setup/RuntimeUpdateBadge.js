import ImageRuntimeRow from './ImageRuntimeRow.js';

export default class RuntimeUpdateBadge {
  static apply(body, id, info) {
    if (!info || !body) return;
    const row = body.querySelector(`[data-runtime-id="${CSS.escape(id)}"]`);
    if (!row) return;
    RuntimeUpdateBadge._state(row, id, info);
    RuntimeUpdateBadge._pill(row, info);
  }

  static _state(row, id, info) {
    const slot = row.querySelector('[data-runtime-state]');
    if (!slot) return;
    if (info.updateAvailable) {
      slot.innerHTML = ImageRuntimeRow.installButton(id, 'Update', info.latest ? `Update ${info.current} → ${info.latest}` : 'Newer release available upstream');
      slot.classList.remove('is-current');
      return;
    }
    slot.textContent = 'Up to date';
    slot.classList.add('is-current');
    slot.title = info.current ? `Installed ${info.current} is the latest release` : '';
  }

  static _pill(row, info) {
    const existing = row.querySelector('[data-update-pill]');
    if (existing) existing.remove();
    const head = row.querySelector('.runtime-head');
    if (!info.updateAvailable || !head) return;
    const pill = document.createElement('span');
    pill.className = 'luma-badge';
    pill.setAttribute('data-update-pill', '');
    pill.textContent = 'Update available';
    pill.title = info.latest ? `Installed ${info.current} → ${info.latest}` : '';
    head.appendChild(pill);
  }
}
