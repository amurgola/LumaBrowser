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
      <div class="provider-default-row" style="margin-top:8px;">
        <label class="form-label" for="${selectId}" style="margin:0;">${label}</label>
        <select class="form-select" id="${selectId}" data-image-role="${roleKey}" style="max-width:280px;">${opts}</select>
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
      <div class="provider-default-row" style="margin-top:4px;">
        <label class="form-label" style="margin:0;">${label} model</label>
        <select class="form-select" data-image-model-server="${esc(server.id)}" style="max-width:280px;">${modelOpts}</select>
      </div>`;
  }
}
