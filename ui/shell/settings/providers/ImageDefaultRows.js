import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class ImageDefaultRows {
  static html(imageCfg, roleKey, label, selectId) {
    if (!imageCfg || !Array.isArray(imageCfg.servers)) return '';
    const esc = HtmlEscaper.escape;
    const kind = ImageDefaultRows.kindOf(roleKey);
    const active = imageCfg.active ? imageCfg.active[kind] : null;
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

  static kindOf(roleKey) {
    if (roleKey === 'image-edit') return 'edit';
    return roleKey === 'image-video' ? 'video' : 'generate';
  }

  static _modelRow(server, label) {
    if (!server || !Array.isArray(server.models) || !server.models.length) return '';
    const remote = server.location === 'remote';
    if (!remote && !server.modelField) return '';
    const esc = HtmlEscaper.escape;
    const target = remote ? `data-image-model-server="${esc(server.id)}"` : `data-image-local-model="${esc(server.modelField)}"`;
    const modelOpts = [ImageDefaultRows._firstOption(server, remote)]
      .concat(server.models.map((m) => `<option value="${esc(m.id)}"${m.id === server.selectedModel ? ' selected' : ''}>${esc(m.label || m.id)}</option>`))
      .join('');
    return `
      <div class="provider-default-row gs-row gs-row--nested">
        <div class="gs-row-text">
          <span class="gs-row-label">${label} model</span>
        </div>
        <select class="form-select gs-input-select" ${target} aria-label="${esc(label)} model">${modelOpts}</select>
      </div>`;
  }

  static _firstOption(server, remote) {
    const esc = HtmlEscaper.escape;
    if (remote) {
      const hostDefault = server.modelLabel ? `Host default (${server.modelLabel})` : 'Host default';
      return `<option value=""${!server.selectedModel ? ' selected' : ''}>${esc(hostDefault)}</option>`;
    }
    return server.models.some((m) => m.id === server.selectedModel) ? '' : '<option value="" selected disabled>Choose a model</option>';
  }
}
