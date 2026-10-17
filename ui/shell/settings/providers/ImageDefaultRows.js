import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class ImageDefaultRows {
  static html(imageCfg, roleKey, label, selectId) {
    if (!imageCfg || !Array.isArray(imageCfg.servers)) return '';
    const esc = HtmlEscaper.escape;
    const kind = roleKey === 'image-edit' ? 'edit' : 'generate';
    const active = imageCfg.active ? (kind === 'edit' ? imageCfg.active.edit : imageCfg.active.generate) : null;
    const opts = imageCfg.servers
      .filter((s) => s && s.kind === kind)
      .map((s) => `<option value="${esc(s.id)}"${s.id === active ? ' selected' : ''}>${esc(s.name)}${s.location === 'remote' ? ' (shared)' : ''}</option>`)
      .join('');
    if (!opts) return '';
    const activeServer = imageCfg.servers.find((s) => s && s.id === active) || null;
    return `
      <div class="provider-default-row gs-row">
        <div class="gs-row-text">
          <label class="gs-row-label" for="${selectId}">${label}</label>
          <span class="gs-row-help">Runs on this server, local or shared by a paired LumaBrowser.</span>
        </div>
        <select class="form-select gs-input-select" id="${selectId}" data-image-role="${roleKey}">${opts}</select>
      </div>${ImageDefaultRows._modelRow(activeServer, label)}`;
  }

  static _modelRow(server, label) {
    if (!server || server.location !== 'remote' || !Array.isArray(server.models) || !server.models.length) return '';
    const esc = HtmlEscaper.escape;
    const hostDefault = server.modelLabel ? `Host default (${server.modelLabel})` : 'Host default';
    const modelOpts = [`<option value=""${!server.selectedModel ? ' selected' : ''}>${esc(hostDefault)}</option>`]
      .concat(server.models.map((m) => `<option value="${esc(m.id)}"${m.id === server.selectedModel ? ' selected' : ''}>${esc(m.label || m.id)}</option>`))
      .join('');
    return `
      <div class="provider-default-row gs-row gs-row--nested">
        <div class="gs-row-text">
          <span class="gs-row-label">${label} model</span>
        </div>
        <select class="form-select gs-input-select" data-image-model-server="${esc(server.id)}" aria-label="${esc(label)} model">${modelOpts}</select>
      </div>`;
  }
}
