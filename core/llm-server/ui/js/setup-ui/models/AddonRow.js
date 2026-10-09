import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class AddonRow {
  static view(m, active) {
    const busy = !!(active && active.id === m.id);
    return {
      mlKey: m.id,
      expanded: busy,
      caretEmpty: false,
      name: m.label || m.id,
      renameHtml: '',
      tagsHtml: AddonRow._tags(m).join(' '),
      sizeText: (m.file && m.file.bytes) ? ByteFormatter.bytes(m.file.bytes) : '',
      actionsHtml: AddonRow._action(m, busy, !!(active && !busy)),
      metaHtml: `<div class="runtime-meta">${AddonRow._meta(m).join('')}</div>`,
      ctxFitHtml: '',
      fitHtml: '',
      quantHtml: '',
      dlHtml: busy ? AddonRow.progressHtml(active) : '',
      blurbHtml: AddonRow._blurb(m),
      shardsHtml: '',
    };
  }

  static progressHtml(a) {
    const fmt = ByteFormatter.bytes;
    const esc = HtmlEscaper.escape;
    const pct = a.total > 0 ? Math.min(100, (a.received / a.total) * 100) : 0;
    const bytes = a.total > 0 ? `${fmt(a.received)} / ${fmt(a.total)}` : (a.received ? fmt(a.received) : '');
    return '<div class="runtime-progress is-active">'
      + `<div class="runtime-progress-label"><span>${esc(a.phase || '')}</span><span>${esc(bytes)}</span></div>`
      + `<div class="luma-progress ${a.indeterminate ? 'indeterminate' : ''}"><div class="luma-progress-fill" style="width:${pct}%"></div></div>`
      + (a.label ? `<div class="models-default-note">${esc(a.label)}</div>` : '')
      + '</div>';
  }

  static _tags(m) {
    const esc = HtmlEscaper.escape;
    const rt = m.runtime;
    const tags = [`<span class="luma-badge muted" title="Model format">${esc(m.kind || 'add-on')}</span>`];
    if (rt) {
      tags.push(`<span class="luma-badge ${rt.installed ? 'ok' : 'muted'}" title="Bound runtime">${esc(rt.name)}${rt.installed ? '' : ' · not installed'}</span>`);
      if (rt.hardware && !rt.hardware.ready) tags.push(`<span class="luma-badge bad" title="${esc(rt.hardware.note || '')}">hardware: not ready</span>`);
    }
    if (m.installed) tags.push('<span class="luma-badge ok">installed</span>');
    if (m.licenseNote) tags.push(`<span class="luma-badge warn" title="${esc(m.licenseNote)}">license</span>`);
    return tags;
  }

  static _action(m, busy, otherBusy) {
    const rt = m.runtime;
    if (m.installed) return '';
    if (busy) return '<button class="luma-btn luma-btn--sm danger" data-ml-act="addon-cancel">Cancel</button>';
    if (otherBusy) return '<button class="luma-btn primary luma-btn--sm" disabled title="Another setup is in progress">Download &amp; set up</button>';
    if (rt && !rt.installed && !rt.installable) {
      return `<button class="luma-btn primary luma-btn--sm" disabled title="${HtmlEscaper.escape(rt.name)} cannot be installed automatically on this host">Download &amp; set up</button>`;
    }
    return `<button class="luma-btn primary luma-btn--sm" data-ml-act="addon-dl" data-id="${HtmlEscaper.escape(m.id)}">Download &amp; set up</button>`;
  }

  static _meta(m) {
    const esc = HtmlEscaper.escape;
    const row = (label, value, dim) => `<div class="runtime-meta-row"><span class="runtime-meta-label">${label}</span><span class="runtime-meta-value${dim ? ' dim' : ''}">${value}</span></div>`;
    const rt = m.runtime;
    const meta = [];
    if (m.file && m.file.bytes) meta.push(row('Download', `${ByteFormatter.bytes(m.file.bytes)} · ${esc(m.file.filename)}`));
    if (m.contextLength) meta.push(row('Context', `up to ${Number(m.contextLength).toLocaleString()} tokens`));
    if (rt) {
      meta.push(row('Runtime', `${esc(rt.name)} · ${AddonRow._runtimeState(rt)}`));
      if (rt.hardware && rt.hardware.note) meta.push(row('Hardware', esc(rt.hardware.note)));
    }
    if (m.destPath) meta.push(row('Path', esc(m.destPath), true));
    return meta;
  }

  static _runtimeState(rt) {
    if (rt.installed) return `installed${rt.version ? ', ' + HtmlEscaper.escape(rt.version) : ''}`;
    return rt.installable ? 'will be installed first' : 'cannot be installed automatically here';
  }

  static _blurb(m) {
    const esc = HtmlEscaper.escape;
    return (m.blurb ? `<div class="img-mrow-blurb">${esc(m.blurb)}</div>` : '')
      + (m.licenseNote ? `<div class="img-mrow-blurb img-license-note">${esc(m.licenseNote)}</div>` : '');
  }
}
