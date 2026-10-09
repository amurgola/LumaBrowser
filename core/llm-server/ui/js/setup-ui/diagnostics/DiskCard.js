import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import DiagnosticsText from './DiagnosticsText.js';

export default class DiskCard {
  static render(doc, disks) {
    const pill = doc.getElementById('diskPill');
    const body = doc.getElementById('diskBody');
    if (!disks.available) {
      pill.className = 'luma-badge bad';
      pill.textContent = 'unavailable';
      body.className = 'luma-error';
      body.textContent = disks.reason || 'Could not enumerate volumes';
      return;
    }
    const vols = disks.volumes || [];
    pill.className = 'luma-badge accent';
    pill.textContent = `${vols.length} ${vols.length === 1 ? 'volume' : 'volumes'}`;
    if (vols.length === 0) {
      body.className = 'luma-empty';
      body.textContent = 'No volumes reported.';
      return;
    }
    body.className = '';
    body.innerHTML = vols.map(DiskCard._volumeHtml).join('');
  }

  static _volumeHtml(v) {
    const esc = HtmlEscaper.escape;
    const fmt = ByteFormatter.bytes;
    const used = v.totalBytes - v.freeBytes;
    const ratio = v.totalBytes > 0 ? used / v.totalBytes : 0;
    const fillPct = Math.max(0, Math.min(100, ratio * 100));
    const label = [v.mount, v.label].filter(Boolean).join(' · ');
    return `
                    <div class="disk-item">
                        <div class="disk-head">
                            <span class="disk-name">${esc(label || v.mount || 'Volume')}</span>
                            <span class="${DiagnosticsText.usageBadgeClass(ratio)}">${DiagnosticsText.pct(used, v.totalBytes)} used</span>
                        </div>
                        <div class="kv-list">
                            <div class="kv-row"><span class="kv-key">Free</span><span class="kv-val">${fmt(v.freeBytes)} of ${fmt(v.totalBytes)}</span></div>
                            <div class="kv-row"><span class="kv-key">Filesystem</span><span class="kv-val">${esc(v.filesystem || 'n/a')}${v.driveType ? ' · ' + esc(v.driveType) : ''}</span></div>
                        </div>
                        <div class="luma-progress"><div class="luma-progress-fill" style="width:${fillPct}%"></div></div>
                    </div>
                `;
  }
}
