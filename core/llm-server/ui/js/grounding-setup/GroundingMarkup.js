import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class GroundingMarkup {
  static STATE_LABEL = { idle: 'Stopped', starting: 'Loading…', ready: 'Running', stopping: 'Stopping…', error: 'Error' };

  static pill(view) {
    if (!view.configured) return { text: 'Not set up', className: 'luma-badge' };
    const tone = view.state === 'ready' ? 'ok' : view.state === 'error' ? 'danger' : 'accent';
    return { text: GroundingMarkup.STATE_LABEL[view.state] || view.state, className: `luma-badge ${tone}` };
  }

  static html(s) {
    const view = s.view;
    const running = view.state === 'ready' || view.state === 'starting';
    const rows = ['<p class="luma-muted">A small vision model that finds buttons, icons and fields on screenshots, '
      + 'so the agent can click pages and apps whose markup does not name their controls. '
      + 'It runs on its own server beside your chat model.</p>'];
    if (view.configured) rows.push(GroundingMarkup._status(view));
    const lastError = s.error || view.lastError;
    if (lastError) rows.push(`<div class="plan-error"><div class="plan-error-title">Problem</div><div class="plan-error-advice">${HtmlEscaper.escape(lastError)}</div></div>`);
    rows.push(`<div style="margin:8px 0">${(view.recommended || []).map((r) => GroundingMarkup._recommended(r, s)).join('')}</div>`);
    rows.push(`<div class="plan-action-row">${GroundingMarkup._buttons(view, running, s).join(' ')}</div>`);
    rows.push('<p class="luma-muted">Loads when first needed and unloads after 10 idle minutes.</p>');
    if (s.desktop && s.desktop.supported) rows.push(GroundingMarkup._desktop(s.desktop.enabled));
    return rows.join('');
  }

  static _status(view) {
    const esc = HtmlEscaper.escape;
    return `<div class="kv-row"><span class="kv-key">Model</span><span class="kv-val">${esc(view.modelName || '')}</span></div>`
      + `<div class="kv-row"><span class="kv-key">Server</span><span class="kv-val">${esc(GroundingMarkup.STATE_LABEL[view.state] || view.state)}${view.port ? ` <span class="luma-muted">:${view.port}</span>` : ''}</span></div>`;
  }

  static _recommended(r, s) {
    const esc = HtmlEscaper.escape;
    const blocked = s.busy || s.dl ? 'disabled' : '';
    let action;
    if (s.dl && s.dl.id === r.id) {
      const pct = s.dl.total ? Math.round((s.dl.received / s.dl.total) * 100) : 0;
      action = `<span class="luma-muted">${esc(s.dl.file || '')} ${pct}% (${ByteFormatter.bytes(s.dl.received)} / ${ByteFormatter.bytes(s.dl.total)})</span> `
        + '<button class="luma-btn luma-btn--sm" data-g-cancel>Cancel</button>';
    } else if (s.view.modelPath && s.view.modelPath.endsWith(r.file)) {
      action = '<span class="luma-badge ok">In use</span>';
    } else if (r.installed) {
      action = `<button class="luma-btn luma-btn--sm" data-g-use="${esc(r.id)}" ${blocked}>Use</button>`;
    } else {
      action = `<button class="luma-btn primary luma-btn--sm" data-g-dl="${esc(r.id)}" ${blocked}>Download (~${r.approxGb} GB)</button>`;
    }
    return `<div class="defaults-row"><span>${esc(r.label)}</span><span>${action}</span></div>`;
  }

  static _buttons(view, running, s) {
    const buttons = [`<button class="luma-btn luma-btn--sm" data-g-pick ${s.busy || s.dl ? 'disabled' : ''}>Choose a GGUF…</button>`];
    if (view.configured && !running) buttons.push(`<button class="luma-btn luma-btn--sm" data-g-start ${s.busy ? 'disabled' : ''}>Start now</button>`);
    if (running) buttons.push('<button class="luma-btn luma-btn--sm danger" data-g-stop>Stop server</button>');
    if (view.configured) buttons.push(`<button class="luma-btn luma-btn--sm" data-g-clear ${s.busy || running ? 'disabled' : ''}>Remove</button>`);
    return buttons;
  }

  static _desktop(enabled) {
    return '<div class="defaults-row"><label><input type="checkbox" data-g-desktop '
      + `${enabled ? 'checked' : ''}> Allow desktop control</label></div>`
      + '<p class="luma-muted">Lets the agent see and click other apps on this PC (Windows UI Automation first, '
      + 'the grounding model for apps and games that draw their own UI). The chat asks before each click or '
      + 'keystroke. Games protected by anti-cheat and apps running as administrator are always refused.</p>';
  }
}
