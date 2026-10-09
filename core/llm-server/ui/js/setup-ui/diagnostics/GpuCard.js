import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import GpuHealthHtml from './GpuHealthHtml.js';
import PcieText from './PcieText.js';

export default class GpuCard {
  static render(doc, gpu) {
    const pill = doc.getElementById('gpuPill');
    const body = doc.getElementById('gpuBody');
    const adapters = (gpu && gpu.adapters) || [];
    const healthHtml = GpuHealthHtml.html(gpu && gpu.health);
    body.className = '';
    if (!gpu.available) {
      pill.className = 'luma-badge bad';
      pill.textContent = 'unavailable';
      body.innerHTML = `<div class="luma-error" style="margin-bottom:10px;">${HtmlEscaper.escape(gpu.reason || 'GPU info not available')}</div>` + healthHtml;
      return;
    }
    pill.className = 'luma-badge accent';
    pill.textContent = GpuCard.pillText(gpu, adapters);
    if (adapters.length === 0) {
      body.innerHTML = '<div class="luma-empty" style="margin-bottom:10px;">Chromium reports no GPU adapters.</div>' + healthHtml;
      return;
    }
    body.innerHTML = GpuCard._totalsHtml(gpu) + adapters.map(GpuCard._adapterHtml).join('') + healthHtml;
  }

  static pillText(gpu, adapters) {
    const totalVram = Number(gpu.totalVramBytes) || 0;
    return totalVram > 0
      ? `${adapters.length} · ${ByteFormatter.bytes(totalVram)} VRAM`
      : `${adapters.length} ${adapters.length === 1 ? 'adapter' : 'adapters'}`;
  }

  static _totalsHtml(gpu) {
    const fmt = ByteFormatter.bytes;
    const total = Number(gpu.totalVramBytes) || 0;
    const free = Number(gpu.freeVramBytes) || 0;
    if (!(total > 0)) return '';
    return `
                <div class="gpu-totals">
                    <div class="kv-row"><span class="kv-key">Total VRAM</span><span class="kv-val">${fmt(total)}</span></div>
                    ${free > 0 ? `<div class="kv-row"><span class="kv-key">Free VRAM</span><span class="kv-val">${fmt(free)}${total ? ' (' + Math.round((free / total) * 100) + '%)' : ''}</span></div>` : ''}
                    <div class="kv-row" style="color:var(--text-muted);font-size:11px;"><span>VRAM and PCIe details come from nvidia-smi (NVIDIA) and the display-adapter registry (Windows non-NVIDIA).</span></div>
                </div>
            `;
  }

  static _adapterHtml(a) {
    const esc = HtmlEscaper.escape;
    const name = a.displayName || a.deviceString || `${a.vendor || 'Unknown'} device 0x${(a.deviceId || 0).toString(16)}`;
    const activeBadge = a.active
      ? '<span class="luma-badge ok">active</span>'
      : '<span class="luma-badge muted" style="color:var(--text-muted);border:1px solid var(--border-strong);">inactive</span>';
    return `
                    <div class="gpu-item">
                        <div class="gpu-head">
                            <span class="gpu-name">${esc(name)}</span>
                            ${activeBadge}
                        </div>
                        <div class="kv-list">
                            <div class="kv-row"><span class="kv-key">Vendor</span><span class="kv-val">${esc(a.vendor || 'n/a')}</span></div>
                            <div class="kv-row"><span class="kv-key">Driver</span><span class="kv-val">${esc(a.driverVendor || 'n/a')} ${esc(a.driverVersion || '')}</span></div>
                            ${a.driverDate ? `<div class="kv-row"><span class="kv-key">Driver date</span><span class="kv-val">${esc(a.driverDate)}</span></div>` : ''}
                            ${GpuCard._vramRow(a)}
                            ${GpuCard._pcieRow(a.pcie)}
                            <div class="kv-row"><span class="kv-key">IDs</span><span class="kv-val">vendor 0x${(a.vendorId || 0).toString(16)} / device 0x${(a.deviceId || 0).toString(16)}</span></div>
                        </div>
                        ${GpuCard._vramBar(a)}
                    </div>
                `;
  }

  static _vramRow(a) {
    if (a.vramTotalBytes == null) return '';
    const fmt = ByteFormatter.bytes;
    return `
                    <div class="kv-row">
                        <span class="kv-key">VRAM</span>
                        <span class="kv-val">
                            ${a.vramFreeBytes != null ? `${fmt(a.vramFreeBytes)} free of ${fmt(a.vramTotalBytes)}` : fmt(a.vramTotalBytes)}
                            ${a.vramSource ? `<span class="muted-inline"> · ${HtmlEscaper.escape(a.vramSource)}</span>` : ''}
                        </span>
                    </div>
                `;
  }

  static _pcieRow(raw) {
    const pcie = PcieText.describe(raw);
    if (!pcie) return '';
    const esc = HtmlEscaper.escape;
    return `
                    <div class="kv-row">
                        <span class="kv-key">PCIe link</span>
                        <span class="kv-val">
                            ${esc(pcie.cur || 'n/a')}
                            ${pcie.bw ? `<span class="muted-inline"> · ${esc(pcie.bw)}</span>` : ''}
                            ${pcie.max && pcie.max !== pcie.cur ? `<span class="muted-inline"> · max ${esc(pcie.max)}</span>` : ''}
                            ${pcie.downtrained ? '<span class="luma-badge warn" style="margin-left:6px;">downtrained</span>' : ''}
                        </span>
                    </div>
                `;
  }

  static _vramBar(a) {
    if (!(a.vramTotalBytes && a.vramFreeBytes != null)) return '';
    return `
                    <div class="luma-progress"><div class="luma-progress-fill" style="width:${((a.vramTotalBytes - a.vramFreeBytes) / a.vramTotalBytes) * 100}%"></div></div>
                `;
  }
}
