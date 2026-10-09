export default class ProgressPane {
  static render(pane, prefix, onCancel) {
    pane.innerHTML = `
        <div class="setup-wizard__prog-phase" id="${prefix}Phase">Preparing…</div>
        <div class="setup-wizard__bar"><div class="setup-wizard__bar-fill" id="${prefix}Bar"></div></div>
        <div class="setup-wizard__prog-sub" id="${prefix}Sub"></div>
        <div style="display:flex; gap:10px; margin-top:14px;">
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="${prefix}Cancel" type="button">Cancel</button>
        </div>
      `;
    const cancelBtn = pane.querySelector(`#${prefix}Cancel`);
    cancelBtn.addEventListener('click', () => {
      onCancel();
      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Canceling…';
    });
  }

  static hooks(pane, prefix) {
    const find = (suffix) => pane.querySelector(`#${prefix}${suffix}`);
    const setSub = (text) => { const s = find('Sub'); if (s) s.textContent = text; };
    return {
      onPhase: (text) => { const e = find('Phase'); if (e) e.textContent = text; },
      onBar: (frac, sub) => {
        const bar = find('Bar');
        if (bar) {
          const indeterminate = frac == null;
          bar.classList.toggle('setup-wizard__bar-fill--indet', indeterminate);
          bar.style.width = indeterminate ? '' : (Math.max(0, Math.min(1, frac)) * 100 + '%');
        }
        if (sub != null) setSub(sub);
      },
      onSub: setSub,
    };
  }
}
