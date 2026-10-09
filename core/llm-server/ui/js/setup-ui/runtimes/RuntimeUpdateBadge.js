export default class RuntimeUpdateBadge {
  static apply(row, info, doc = document) {
    if (!row || !info) return;
    RuntimeUpdateBadge._button(row.querySelector('button[data-runtime-action="install"]'), info);
    RuntimeUpdateBadge._pill(row, info, doc);
  }

  static _button(btn, info) {
    if (!btn) return;
    if (info.updateAvailable) {
      btn.textContent = 'Update';
      btn.dataset.updateAvailable = '1';
      btn.title = info.latest ? `Update ${info.current} → ${info.latest}` : 'Newer release available upstream';
    } else if (btn.dataset.updateAvailable === '1') {
      btn.textContent = 'Update';
      delete btn.dataset.updateAvailable;
      btn.title = '';
    }
  }

  static _pill(row, info, doc) {
    const existing = row.querySelector('[data-update-pill]');
    if (existing) existing.remove();
    const head = row.querySelector('.runtime-head');
    if (!info.updateAvailable || !head) return;
    const pill = doc.createElement('span');
    pill.className = 'luma-badge accent';
    pill.setAttribute('data-update-pill', '');
    pill.textContent = info.latest ? `update: ${info.latest}` : 'update available';
    pill.title = info.latest ? `Installed ${info.current} → ${info.latest}` : '';
    head.appendChild(pill);
  }
}
