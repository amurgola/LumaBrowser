import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class InstalledModelRow {
  static KIND_LABEL = { generate: 'generation', edit: 'edit', video: 'video' };

  static KIND_SHORT = { generate: 'gen', edit: 'edit', video: 'video' };

  static FILE_ROLE_LABEL = { vae: 'VAE', llm: 'text encoder', vision: 'vision projector', diffusion: 'weights', clip_l: 'CLIP', t5xxl: 'T5' };

  static kindOf(m) {
    return m.kind === 'edit' ? 'edit' : (m.kind === 'video' ? 'video' : 'generate');
  }

  static view(m, defaults, downloading) {
    const d = defaults || {};
    const kind = InstalledModelRow.kindOf(m);
    const pinnedId = kind === 'edit' ? d.editModelId : (kind === 'video' ? d.videoModelId : d.modelId);
    const unified = kind === 'generate' && !!m.supportsEdit;
    const flags = { kind, pinned: pinnedId === m.id, unified, editPinned: unified && d.editModelId === m.id };
    return {
      mlKey: m.id,
      expanded: false,
      caretEmpty: false,
      name: m.label || m.id,
      tagsHtml: InstalledModelRow._tags(m, flags),
      sizeText: InstalledModelRow._sizeText(m),
      actionsHtml: InstalledModelRow._actions(m, flags, downloading),
      metaHtml: InstalledModelRow._meta(m),
      ctxFitHtml: '', fitHtml: '', quantHtml: '', dlHtml: '', blurbHtml: '', shardsHtml: '',
    };
  }

  static _files(m) {
    return m.files ? Object.keys(m.files).filter((k) => m.files[k] && m.files[k].path) : [];
  }

  static _sizeText(m) {
    const total = InstalledModelRow._files(m).reduce((s, k) => s + (m.files[k].bytes || 0), 0);
    return total ? ByteFormatter.bytes(total) : '';
  }

  static _roleLabel(update) {
    return InstalledModelRow.FILE_ROLE_LABEL[update.role] || update.role;
  }

  static _fileUpdates(m) {
    return Array.isArray(m.fileUpdates) ? m.fileUpdates : [];
  }

  static _tags(m, f) {
    const esc = HtmlEscaper.escape;
    const ncPill = m.licenseNote ? `<span class="luma-badge warn" title="${esc(m.licenseNote)}">NC</span>` : '';
    const importedPill = m.manifest && m.manifest.imported
      ? '<span class="luma-badge accent" title="Imported fine-tune">imported</span>' : '';
    const kindPill = `<span class="luma-badge ${f.kind === 'video' ? 'accent' : 'muted'}" title="Image category">${f.unified ? 'generation + edit' : InstalledModelRow.KIND_LABEL[f.kind]}</span>`;
    const defaultBadge = (f.pinned ? `<span class="luma-badge accent">${InstalledModelRow.KIND_SHORT[f.kind]} default</span>` : '')
      + (f.editPinned ? ' <span class="luma-badge accent">edit default</span>' : '');
    const updatePills = InstalledModelRow._fileUpdates(m).map((u) =>
      `<span class="luma-badge accent" title="${esc(u.note || `Newer ${InstalledModelRow._roleLabel(u)} available: ${u.file}`)}">${esc(InstalledModelRow._roleLabel(u))} update</span>`).join(' ');
    return `${kindPill} ${defaultBadge} ${updatePills} ${ncPill} ${importedPill}`;
  }

  static _actions(m, f, downloading) {
    const id = HtmlEscaper.escape(m.id);
    const short = InstalledModelRow.KIND_SHORT[f.kind];
    return [
      f.pinned ? '' : `<button class="luma-btn primary luma-btn--sm" data-ml-act="pin" data-id="${id}" data-kind="${f.kind}">Pin as ${short} default</button>`,
      (f.unified && !f.editPinned) ? `<button class="luma-btn primary luma-btn--sm" data-ml-act="pin" data-id="${id}" data-kind="edit">Pin as edit default</button>` : '',
      InstalledModelRow._updateButtons(m, downloading),
      InstalledModelRow._moveButtons(id, f),
      `<button class="luma-btn luma-btn--sm" data-ml-act="loras" data-id="${id}">LoRAs / speed</button>`,
      `<button class="luma-btn luma-btn--sm" data-ml-act="uninstall" data-id="${id}">Remove</button>`,
    ].filter(Boolean).join('');
  }

  static _updateButtons(m, downloading) {
    const esc = HtmlEscaper.escape;
    return InstalledModelRow._fileUpdates(m).map((u) =>
      `<button class="luma-btn primary luma-btn--sm" data-ml-act="update-file" data-id="${esc(m.id)}" data-role="${esc(u.role)}" title="${esc(u.note || '')}"${downloading ? ' disabled' : ''}>Update ${esc(InstalledModelRow._roleLabel(u))}${u.approxBytes ? ' · ' + ByteFormatter.bytes(u.approxBytes) : ''}</button>`).join('');
  }

  static _moveButtons(id, f) {
    return ['generate', 'edit', 'video']
      .filter((k) => k !== f.kind && !(f.unified && k === 'edit'))
      .map((to) => {
        const label = InstalledModelRow.KIND_LABEL[to];
        return `<button class="luma-btn luma-btn--sm" data-ml-act="move" data-id="${id}" data-to="${to}">Move to ${label[0].toUpperCase() + label.slice(1)}</button>`;
      }).join('');
  }

  static _meta(m) {
    const esc = HtmlEscaper.escape;
    const files = InstalledModelRow._files(m);
    return `
      <div class="img-mrow-meta">
        <div class="img-mrow-meta-row"><span class="img-mrow-meta-label">Files</span><span class="img-mrow-meta-value dim">${esc(files.length ? files.join(', ') : 'n/a')}</span></div>
        ${m.dir ? `<div class="img-mrow-meta-row"><span class="img-mrow-meta-label">Path</span><span class="img-mrow-meta-value dim">${esc(m.dir)}</span></div>` : ''}
      </div>`;
  }
}
