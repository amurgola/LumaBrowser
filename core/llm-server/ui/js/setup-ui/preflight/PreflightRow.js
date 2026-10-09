import HtmlEscaper from '../../format/HtmlEscaper.js';
import Clipboard from '../../dom/Clipboard.js';

export default class PreflightRow {
  static ACTION_SELECTOR = '[data-pf-action="install"], [data-pf-action="open"], [data-pf-action="recheck"], [data-pf-action="dismiss-vram"]';

  static COPIED_MS = 1500;

  static fixKey(issue) {
    const fix = issue.fix || {};
    return fix.kind === 'install-runtime' ? `${fix.server}:${fix.runtimeId}` : '';
  }

  static build(doc, issue, handlers) {
    const row = doc.createElement('div');
    row.className = `preflight-row ${issue.severity === 'warning' ? 'is-warn' : 'is-error'}`;
    const key = PreflightRow.fixKey(issue);
    if (key) row.dataset.fixKey = key;
    row.innerHTML = PreflightRow._html(issue);
    PreflightRow._wire(row, issue, handlers);
    return row;
  }

  static _html(issue) {
    const esc = HtmlEscaper.escape;
    const { actionHtml, extraHtml } = PreflightRow._fixParts(issue.fix || {});
    return `
            <div class="preflight-txt">
                <div class="preflight-title">${esc(issue.title)}</div>
                <div class="preflight-detail">${esc(issue.detail || '')}</div>
                ${extraHtml}
                <div class="preflight-progress" hidden>
                    <div class="preflight-progress-label"><span data-pf-phase></span><span data-pf-bytes></span></div>
                    <div class="luma-progress" data-pf-bar><div class="luma-progress-fill" data-pf-fill style="width:0%"></div></div>
                </div>
            </div>
            <div class="preflight-action">${actionHtml}</div>
        `;
  }

  static _fixParts(fix) {
    if (fix.kind === 'install-runtime') {
      return { actionHtml: '<button class="luma-btn primary luma-btn--sm" data-pf-action="install" type="button">Download and install</button>', extraHtml: '' };
    }
    if (fix.kind === 'open-view') {
      return { actionHtml: '<button class="luma-btn luma-btn--sm" data-pf-action="open" type="button">Open Setup</button>', extraHtml: '' };
    }
    if (fix.kind === 'dismiss-vram') {
      return { actionHtml: '<button class="luma-btn luma-btn--sm" data-pf-action="dismiss-vram" type="button" title="Hide until the pressure changes">Dismiss</button>', extraHtml: '' };
    }
    if (fix.kind === 'sysdeps') {
      return { actionHtml: '<button class="luma-btn primary luma-btn--sm" data-pf-action="recheck" type="button">Check again</button>', extraHtml: PreflightRow._sysdepsHtml(fix) };
    }
    return { actionHtml: '', extraHtml: '' };
  }

  static _sysdepsHtml(fix) {
    const esc = HtmlEscaper.escape;
    const unmapped = (fix.missing || []).filter((m) => !m.pkg).map((m) => m.soname);
    const command = fix.aptLine
      ? `<div class="preflight-cmd"><code data-pf-cmd>${esc(fix.aptLine)}</code>
                     <button class="luma-btn luma-btn--sm" data-pf-action="copy" type="button">Copy</button></div>`
      : '';
    const extra = unmapped.length
      ? `<div class="preflight-detail">Also needed but not in a known package: ${esc(unmapped.join(', '))}</div>`
      : '';
    return command + extra;
  }

  static _wire(row, issue, handlers) {
    const fix = issue.fix || {};
    const btn = row.querySelector(PreflightRow.ACTION_SELECTOR);
    if (!btn) return;
    if (fix.kind === 'dismiss-vram') btn.addEventListener('click', () => handlers.onDismissVram(issue));
    else if (fix.kind === 'install-runtime') btn.addEventListener('click', () => handlers.onInstall(issue, row, btn));
    else if (fix.kind === 'open-view') btn.addEventListener('click', () => handlers.onOpen(fix.view));
    else if (fix.kind === 'sysdeps') PreflightRow._wireSysdeps(row, btn, handlers);
  }

  static _wireSysdeps(row, btn, handlers) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Checking…';
      try { await handlers.onRecheck(); } finally {
        btn.disabled = false;
        btn.textContent = 'Check again';
      }
    });
    const copyBtn = row.querySelector('[data-pf-action="copy"]');
    if (copyBtn) copyBtn.addEventListener('click', () => PreflightRow._copy(row, copyBtn));
  }

  static async _copy(row, copyBtn) {
    const cmd = row.querySelector('[data-pf-cmd]');
    const ok = await Clipboard.copyText(cmd ? cmd.textContent : '');
    if (!ok) return;
    copyBtn.textContent = 'Copied';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, PreflightRow.COPIED_MS);
  }
}
