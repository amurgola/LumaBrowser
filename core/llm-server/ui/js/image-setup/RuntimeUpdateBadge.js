export default class RuntimeUpdateBadge {
  static apply(body, id, info) {
    if (!info || !body) return;
    const row = body.querySelector(`[data-runtime-id="${CSS.escape(id)}"]`);
    if (!row) return;
    RuntimeUpdateBadge._button(row, info);
    RuntimeUpdateBadge._pill(row, info);
  }

  static _button(row, info) {
    const btn = row.querySelector('button[data-act="install"]');
    if (!btn) return;
    btn.textContent = 'Update';
    if (info.updateAvailable) {
      btn.dataset.updateAvailable = '1';
      btn.title = info.latest ? `Update ${info.current} → ${info.latest}` : 'Newer release available upstream';
    } else {
      delete btn.dataset.updateAvailable;
      btn.title = '';
    }
  }

  static _pill(row, info) {
    const existing = row.querySelector('[data-update-pill]');
    if (existing) existing.remove();
    const head = row.querySelector('.runtime-head');
    if (!info.updateAvailable || !head) return;
    const pill = document.createElement('span');
    pill.className = 'luma-badge accent';
    pill.setAttribute('data-update-pill', '');
    pill.textContent = info.latest ? `update: ${info.latest}` : 'update available';
    pill.title = info.latest ? `Installed ${info.current} → ${info.latest}` : '';
    head.appendChild(pill);
  }
}
