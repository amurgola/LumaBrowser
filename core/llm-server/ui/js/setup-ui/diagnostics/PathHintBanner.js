import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PathHintBanner {
  static html(cuda) {
    const hint = cuda && cuda.pathHint;
    if (!hint || (cuda && cuda.pathHintDismissed)) return '';
    const esc = HtmlEscaper.escape;
    const cmd = hint.powershellCommand || '';
    return `
                <div class="path-hint" data-path-hint>
                    <div class="path-hint-title">Found nvidia-smi at <code>${esc(hint.foundAt || '')}</code></div>
                    <div class="path-hint-body">
                        <details class="path-hint-info"><summary>More info</summary>
                        nvidia-smi works for this app (we're using its absolute path) but bare <code>nvidia-smi</code> isn't reachable from the system PATH the way other tools expect. Fix the PATH if you want other apps + terminals to find it; we'll continue working either way.
                        </details>
                        ${cmd ? '<div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Paste this single line into PowerShell (no admin needed):</div>' : ''}
                        ${cmd ? `<pre>${esc(cmd)}</pre>` : ''}
                        <div class="path-hint-actions">
                            ${hint.canApplyAutomatically ? `<button class="luma-btn primary luma-btn--sm" data-fix-path data-dir="${esc(hint.directory || '')}">Fix it for me</button>` : ''}
                            ${cmd ? '<button class="luma-btn luma-btn--sm" data-copy-cmd>Copy command</button>' : ''}
                            <button class="luma-btn luma-btn--sm" data-dismiss-hint>Don't show again</button>
                            <span class="path-hint-status" data-fix-status></span>
                        </div>
                        <div style="margin-top:8px;color:var(--text-muted);font-size:11px;">
                            After it runs, click <strong>Refresh</strong> to re-probe.
                        </div>
                    </div>
                </div>
            `;
  }
}
