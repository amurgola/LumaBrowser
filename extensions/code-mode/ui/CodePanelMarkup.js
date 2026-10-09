import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class CodePanelMarkup {
  static STATUS_LABEL = { drafting: 'Building', installing: 'Installing', installed: 'Installed', error: 'Needs fixing', editing: 'Editing' };

  static BATCH_LABEL = { queued: 'Queued', running: 'Running…', done: 'Done', error: 'Failed' };

  static INSTRUCTION_CHARS = 60;

  static fileDot(file) {
    if (file.phase === 'writing') return { cls: 'writing', title: 'Writing…' };
    return file.ok ? { cls: 'ok', title: 'Valid' } : { cls: 'bad', title: 'Has problems' };
  }

  static laneDotClass(status) {
    if (status === 'running') return 'writing';
    if (status === 'error') return 'bad';
    return status === 'done' ? 'ok' : 'queued';
  }

  static batchHtml(lanes) {
    const esc = HtmlEscaper.escapeText;
    const rows = lanes.map((l) => {
      const summary = String(l.instruction || '').slice(0, CodePanelMarkup.INSTRUCTION_CHARS);
      return `<div class="cm-code-file">
         <span class="cm-code-dot ${CodePanelMarkup.laneDotClass(l.status)}" title="${esc(CodePanelMarkup.BATCH_LABEL[l.status] || l.status)}"></span>
         <span class="cm-code-fname">${esc(l.kind)}: ${esc(summary)}</span>
       </div>`;
    }).join('');
    return `
      <div class="cm-code-head">
        <span class="cm-code-name">Parallel tasks</span>
        <span class="cm-code-status cm-drafting">${lanes.length} lanes</span>
      </div>
      <div class="cm-code-list">${rows}</div>`;
  }

  static buildHtml(build) {
    const esc = HtmlEscaper.escapeText;
    const status = build.status || 'drafting';
    return `
      <div class="cm-code-head">
        <span class="cm-code-name">${esc(build.id || 'extension')}</span>
        <span class="cm-code-status cm-${status}">${esc(CodePanelMarkup.STATUS_LABEL[status] || status)}</span>
      </div>
      <div class="cm-code-list">${CodePanelMarkup._fileRows(build.files)}</div>
      ${CodePanelMarkup._installedFoot(build.installedId)}`;
  }

  static _fileRows(files) {
    return files.map((f) => {
      const d = CodePanelMarkup.fileDot(f);
      return `<div class="cm-code-file">
         <span class="cm-code-dot ${d.cls}" title="${d.title}"></span>
         <span class="cm-code-fname">${HtmlEscaper.escapeText(f.path)}</span>
       </div>`;
    }).join('');
  }

  static _installedFoot(installedId) {
    if (!installedId) return '';
    return `<div class="cm-code-foot">Activated as <code>${HtmlEscaper.escapeText(installedId)}</code>, live now.</div>`;
  }
}
