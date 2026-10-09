import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import DefaultProviderOptions from './DefaultProviderOptions.js';
import ImageDefaultRows from './ImageDefaultRows.js';

export default class DefaultProviderControl {
  constructor({ log, feedback, rerender, pingChat }) {
    this._log = log;
    this._feedback = feedback;
    this._rerender = rerender;
    this._pingChat = pingChat;
  }

  render(listEl, { configs, activeKey, imageCfg }) {
    const options = DefaultProviderOptions.build(configs);
    const wrap = document.createElement('div');
    wrap.className = 'provider-default-control';
    wrap.innerHTML = DefaultProviderControl.html(options, activeKey, imageCfg);
    listEl.appendChild(wrap);
    this._wireDefaultLlm(wrap, options);
    wrap.querySelectorAll('select[data-image-role]').forEach((sel) => this._wireImageRole(sel));
    wrap.querySelectorAll('select[data-image-model-server]').forEach((sel) => this._wireRemoteModel(sel));
  }

  static html(options, activeKey, imageCfg) {
    const esc = HtmlEscaper.escape;
    return `
    <div class="provider-default-row">
      <label class="form-label" for="defaultProviderSelect" style="margin:0;">Default LLM</label>
      <select class="form-select" id="defaultProviderSelect" style="max-width:280px;">
        <option value="none"${activeKey === 'none' || !activeKey ? ' selected' : ''}>None (disabled)</option>
        ${options.map((o) => `<option value="${esc(o.value)}"${o.value === activeKey ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}
      </select>
    </div>
    ${ImageDefaultRows.html(imageCfg, 'image-generate', 'Default image generation', 'defaultImageGenSelect')}
    ${ImageDefaultRows.html(imageCfg, 'image-edit', 'Default image editor', 'defaultImageEditSelect')}
    <div class="form-help" style="margin-top:6px;">
      Active default: <strong id="defaultProviderActiveLabel">${esc(DefaultProviderOptions.labelFor(activeKey, options))}</strong>.
      Extensions and slots set to "Use active provider (default)" route here.
      Image generation and editing run on their selected server, local or shared by a paired LumaBrowser.
    </div>
  `;
  }

  _wireDefaultLlm(wrap, options) {
    const select = wrap.querySelector('#defaultProviderSelect');
    const labelEl = wrap.querySelector('#defaultProviderActiveLabel');
    select.addEventListener('change', async () => {
      const label = DefaultProviderOptions.labelFor(select.value, options);
      try {
        await window.electronAPI.saveLlmProviderConfig({ provider: select.value });
        if (labelEl) labelEl.textContent = label;
        this._log.add(`Default LLM provider set to ${label}`, 'success');
        this._pingChat();
        this._feedback.markSaved(select, true);
      } catch (e) {
        this._feedback.markSaved(select, false, 'Could not set the default provider: ' + e.message);
      }
    });
  }

  _wireImageRole(sel) {
    sel.addEventListener('change', async () => {
      const role = sel.getAttribute('data-image-role');
      try {
        await window.imageServersAPI.setActiveServer(role, sel.value);
        this._log.add(`Default ${role === 'image-edit' ? 'image editor' : 'image generation'} set to ${DefaultProviderControl._chosen(sel)}`, 'success');
        await this._rerender();
      } catch (e) {
        this._feedback.toast('Could not set the image server: ' + e.message, 'bad');
      }
    });
  }

  _wireRemoteModel(sel) {
    sel.addEventListener('change', async () => {
      try {
        const r = await window.imageServersAPI.setRemoteServerModel(sel.getAttribute('data-image-model-server'), sel.value || null);
        if (r && r.success === false) throw new Error(r.error || 'failed');
        this._log.add(`Shared image server model set to ${DefaultProviderControl._chosen(sel)}`, 'success');
        this._feedback.markSaved(sel, true);
      } catch (e) {
        this._feedback.markSaved(sel, false, 'Could not set the shared image model: ' + e.message);
      }
    });
  }

  static _chosen(sel) {
    return sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent : sel.value;
  }
}
