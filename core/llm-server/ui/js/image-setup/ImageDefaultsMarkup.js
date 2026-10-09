import HtmlEscaper from '../format/HtmlEscaper.js';
import FoldMemory from '../setup/FoldMemory.js';

export default class ImageDefaultsMarkup {
  static pill(enabled, state, port) {
    const text = !enabled ? 'off'
      : state === 'ready' ? `ready · :${port}`
        : state === 'starting' ? 'starting…'
          : state === 'error' ? 'error'
            : 'stopped';
    const className = !enabled || state === 'idle' ? 'luma-badge muted'
      : state === 'ready' ? 'luma-badge ok'
        : state === 'error' ? 'luma-badge bad'
          : 'luma-badge warn';
    return { text, className };
  }

  static modelGroups(models) {
    return {
      gen: models.filter((m) => m.kind !== 'edit' && m.kind !== 'video'),
      edit: models.filter((m) => m.kind === 'edit' || (m.kind !== 'video' && m.supportsEdit)),
      video: models.filter((m) => m.kind === 'video'),
    };
  }

  static html(v) {
    const defaults = v.defaults;
    const canStart = !!(defaults.runtimeId && defaults.modelId && v.enabled);
    const isRunning = v.state === 'ready' || v.state === 'starting';
    return ImageDefaultsMarkup._toggle(v.enabled)
      + ImageDefaultsMarkup._runtimeRow(v.installedRuntimes, defaults)
      + ImageDefaultsMarkup._modelsRow(ImageDefaultsMarkup.modelGroups(v.models), defaults)
      + ImageDefaultsMarkup._moreFold(v)
      + ImageDefaultsMarkup._actionRow(v, canStart, isRunning);
  }

  static _toggle(enabled) {
    return `
      <div class="img-toggle-row">
        <label class="img-toggle">
          <span class="luma-switch">
            <input type="checkbox" id="imgEnabled"${enabled ? ' checked' : ''}/>
            <span class="luma-switch-track"></span>
          </span>
          <span class="img-toggle-label">${enabled ? 'Image server enabled' : 'Image server disabled'}</span>
        </label>
      </div>`;
  }

  static _runtimeRow(runtimes, defaults) {
    const esc = HtmlEscaper.escape;
    const options = runtimes
      .map((r) => `<option value="${esc(r.id)}"${r.id === defaults.runtimeId ? ' selected' : ''}>${esc(r.name)}</option>`)
      .join('');
    return `
      <div class="defaults-row">
        <label for="imgRuntimeSel">Runtime</label>
        <select id="imgRuntimeSel"${runtimes.length ? '' : ' disabled'}>
          <option value="">${runtimes.length ? 'Pick a runtime' : 'install a runtime first'}</option>
          ${options}
        </select>
      </div>`;
  }

  static _option(m, selectedId) {
    const esc = HtmlEscaper.escape;
    return `<option value="${esc(m.id)}"${m.id === selectedId ? ' selected' : ''}>${esc(m.displayName || m.label || m.id)}</option>`;
  }

  static _modelsRow(groups, defaults) {
    const cell = (cap, id, list, selectedId, emptyChoice, extra) => `
          <label class="defaults-trio-cell"${extra}>
            <span class="defaults-trio-cap">${cap}</span>
            <select id="${id}"${list.length ? '' : ' disabled'}>
              <option value="">${list.length ? emptyChoice : 'Download one first'}</option>
              ${list.map((m) => ImageDefaultsMarkup._option(m, selectedId)).join('')}
            </select>
          </label>`;
    return `
      <div class="defaults-row defaults-row--top">
        <label>Models</label>
        <div class="defaults-trio">`
      + cell('Generation', 'imgModelSel', groups.gen, defaults.modelId, 'Pick a model', '')
      + cell('Edit', 'imgEditModelSel', groups.edit, defaults.editModelId, 'None (img2img)',
        ' title="With none picked, edits use img2img on the generation model"')
      + cell('Video', 'imgVideoModelSel', groups.video, defaults.videoModelId, 'None', '')
      + `
        </div>
      </div>`;
  }

  static _moreFold(v) {
    const pinSupported = !!(v.ramPinStatus && v.ramPinStatus.supported);
    const chips = [(v.defaults.pinModelRam && pinSupported) ? 'RAM pin' : '', v.autoUnloadMs > 0 ? 'Auto-unload' : '']
      .filter(Boolean).map((c) => `<span class="fold-chip">${c}</span>`).join('');
    return `
      <details class="setup-fold" data-fold-key="image.more" ${FoldMemory.attr('image.more')}>
        <summary><span class="setup-fold-title">More settings</span><span class="setup-fold-meta">${chips}</span></summary>
        <div class="setup-fold-body">
          <div class="defaults-opt-grid">
            ${pinSupported ? ImageDefaultsMarkup._ramPinOption(v.defaults.pinModelRam) : ''}
            <div class="defaults-opt">
              <label class="defaults-opt-main" for="imgAutoUnload">
                <span class="luma-switch"><input type="checkbox" id="imgAutoUnload"${v.autoUnloadMs > 0 ? ' checked' : ''}/><span class="luma-switch-track"></span></span>
                <span class="defaults-opt-text">
                  <span class="defaults-opt-name">Auto-unload</span>
                  <span class="defaults-opt-cap">Stop the image server after 15&nbsp;minutes of no generations (frees VRAM)</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </details>`;
  }

  static _ramPinOption(pinned) {
    return `<div class="defaults-opt">
              <label class="defaults-opt-main" for="imgRamPin">
                <span class="luma-switch"><input type="checkbox" id="imgRamPin"${pinned ? ' checked' : ''}/><span class="luma-switch-track"></span></span>
                <span class="defaults-opt-text">
                  <span class="defaults-opt-name">RAM pin</span>
                  <span class="defaults-opt-cap">Keep the generation + edit models locked in RAM <span id="imgRamPinHint" class="defaults-caption-hint"></span></span>
                </span>
              </label>
            </div>`;
  }

  static _actionRow(v, canStart, isRunning) {
    const defaults = v.defaults;
    const button = isRunning
      ? '<button class="luma-btn luma-btn--sm danger" id="imgStopBtn">Stop server</button>'
      : `<button class="luma-btn primary luma-btn--sm" id="imgStartBtn"${canStart ? '' : ' disabled'}>Start server</button>`;
    const error = v.state === 'error' && v.server && v.server.lastError
      ? `<span class="fit-note bad">${HtmlEscaper.escape(v.server.lastError)}</span>` : '';
    const hint = !canStart && !isRunning
      ? `<span class="fit-note">${!v.enabled ? 'Enable the image server above.'
        : !defaults.runtimeId ? 'Install + pick a runtime.'
          : 'Download + pick a model.'}</span>`
      : '';
    return `
      <div class="img-action-row">
        ${button}
        ${error}
        ${hint}
      </div>
    `;
  }
}
