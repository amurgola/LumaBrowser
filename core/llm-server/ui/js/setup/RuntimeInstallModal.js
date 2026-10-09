import HtmlEscaper from '../format/HtmlEscaper.js';

export default class RuntimeInstallModal {
  static open(opts) {
    const view = RuntimeInstallModal._view(opts || {});
    return new Promise((resolve) => {
      const wrap = RuntimeInstallModal._buildOverlay(view);
      document.body.appendChild(wrap);
      RuntimeInstallModal._wire(wrap, resolve);
    });
  }

  static _view(o) {
    const installed = !!o.installed;
    return {
      name: o.name || 'this runtime',
      assetSupported: o.assetSupported !== false,
      installed,
      verb: installed ? 'Update' : 'Install',
    };
  }

  static _buildOverlay(view) {
    const wrap = document.createElement('div');
    wrap.className = 'luma-modal-overlay rt-modal-wrap';
    wrap.innerHTML = RuntimeInstallModal._html(view);
    return wrap;
  }

  static _autoInfo(view) {
    return view.assetSupported
      ? 'Fetch the official prebuilt binary from the project’s GitHub releases and install it into the managed runtimes folder. Recommended: no manual setup, kept in one place, and easy to update or remove later.'
      : 'No prebuilt binary is published for this platform, so it can’t be auto-downloaded. Build it from source, then use Locate to point at your executable.';
  }

  static _autoButton(view) {
    return view.assetSupported
      ? `<button class="luma-btn primary luma-btn--sm" data-choice="auto">${view.installed ? 'Download latest' : 'Auto-download'}</button>`
      : '<button class="luma-btn luma-btn--sm" disabled title="No prebuilt for this platform">Unavailable</button>';
  }

  static _html(view) {
    const name = HtmlEscaper.escape(view.name);
    return `
            <div class="luma-modal rt-modal" role="dialog" aria-labelledby="rtModalTitle">
                <div class="rt-modal-header">
                    <h3 class="luma-modal-title" id="rtModalTitle">${view.verb} ${name}</h3>
                    <button class="luma-icon-btn luma-icon-btn--sq rt-modal-x" data-choice="cancel" aria-label="Close">×</button>
                </div>
                <div class="rt-modal-body">
                    <p class="rt-modal-lead">How would you like to ${view.installed ? 'update' : 'set up'} ${name}?</p>
                    <div class="rt-opt${view.assetSupported ? '' : ' is-disabled'}">
                        <div class="rt-opt-title">Automatically download</div>
                        <p class="rt-opt-info">${RuntimeInstallModal._autoInfo(view)}</p>
                        <div class="rt-opt-action">${RuntimeInstallModal._autoButton(view)}</div>
                    </div>
                    <div class="rt-opt">
                        <div class="rt-opt-title">Locate an existing install</div>
                        <p class="rt-opt-info">Already have ${name} built or installed somewhere? Pick the folder that contains its executable and it’ll be used in place: nothing is downloaded or copied.</p>
                        <div class="rt-opt-action"><button class="luma-btn primary luma-btn--sm" data-choice="locate">Locate folder…</button></div>
                    </div>
                </div>
                <div class="rt-modal-footer">
                    <button class="luma-btn luma-btn--sm" data-choice="cancel">Cancel</button>
                </div>
            </div>
        `;
  }

  static _wire(wrap, resolve) {
    let done = false;
    const onKey = (event) => { if (event.key === 'Escape') finish(null); };
    const finish = (value) => {
      if (done) return;
      done = true;
      document.removeEventListener('keydown', onKey);
      wrap.remove();
      resolve(value);
    };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (event) => RuntimeInstallModal._onClick(wrap, event, finish));
  }

  static _onClick(wrap, event, finish) {
    if (event.target === wrap) { finish(null); return; }
    const button = event.target.closest('[data-choice]');
    if (!button || button.disabled) return;
    const choice = button.dataset.choice;
    finish(choice === 'cancel' ? null : choice);
  }
}
