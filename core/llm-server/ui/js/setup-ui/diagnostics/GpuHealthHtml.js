import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class GpuHealthHtml {
  static html(health) {
    if (!health) return '';
    if (health.available === false) return GpuHealthHtml._unavailable(health);
    const devices = health.devices || [];
    if (devices.length === 0) return '';
    const faulted = health.faultedCount || 0;
    return `<div class="gpu-health">
                <div class="gpu-health-title">Display adapter health${faulted > 0 ? ` · <span style="color:var(--bad);">${faulted} faulted</span>` : ''}</div>
                <div class="gpu-health-sub">${GpuHealthHtml._summary(faulted, devices.length)}</div>
                ${devices.map(GpuHealthHtml._deviceHtml).join('')}
                ${faulted > 0 ? GpuHealthHtml._preventionHtml(health.pcieAspm) : ''}
            </div>`;
  }

  static _unavailable(health) {
    return `<div class="gpu-health">
                    <div class="gpu-health-title">Display adapter health</div>
                    <div class="gpu-health-sub">Unavailable: ${HtmlEscaper.escape(health.reason || 'could not enumerate Plug-and-Play devices')}.</div>
                </div>`;
  }

  static _summary(faulted, count) {
    const plural = count === 1 ? '' : 's';
    return faulted > 0
      ? `${faulted} of ${count} adapter${plural} faulted. A faulted card is still listed by Windows but reports no DirectX / 0 VRAM until it's restarted. "Recover" runs an elevated device restart (a Windows admin prompt will appear): equivalent to disabling and re-enabling it in Device Manager.`
      : `All ${count} Plug-and-Play display adapter${plural} healthy.`;
  }

  static _deviceHtml(d) {
    const esc = HtmlEscaper.escape;
    const statusPill = `<span class="luma-badge ${d.isHealthy ? 'ok' : 'bad'}">${esc((d.status || 'UNKNOWN').toLowerCase())}</span>`;
    const presentPill = d.present ? '' : '<span class="luma-badge warn" style="margin-left:6px;">not present</span>';
    const invisibleNote = d.invisibleToApp
      ? '<div class="gpu-health-id" style="color:var(--warn);">Visible to Windows but not to this app: classic faulted state.</div>'
      : '';
    const action = d.recoverable
      ? `<div class="gpu-health-actions">
                           <span class="gpu-health-status" data-recover-status></span>
                           <button class="luma-btn primary luma-btn--sm" data-recover-gpu="${esc(d.instanceId)}">Recover (restart device)</button>
                       </div>`
      : '<div class="gpu-health-actions"><span class="gpu-health-status ok">healthy</span></div>';
    return `
                    <div class="gpu-health-dev">
                        <span class="gpu-health-name">${esc(d.name)}</span>
                        ${statusPill}${presentPill}
                        ${action}
                        <div class="gpu-health-id">${esc(d.instanceId)}</div>
                        ${invisibleNote}
                    </div>
                `;
  }

  static _preventionHtml(aspm) {
    return `
                    <div class="gpu-health-prevent">
                        <div class="gph-title">Stop this happening again</div>
                        <div style="font-size:11.5px;color:var(--text-muted);">A card on an M.2/PCIe riser usually drops because of PCIe power management. Once it's fully gone, only a reboot or reseating the riser brings it back: so the real fix is preventing the drop:</div>
                        <ul>
                            <li><b>Windows (one click below):</b> set the active power plan's PCI Express → Link State Power Management to <b>Off</b>. Reversible.</li>
                            <li><b>BIOS:</b> disable PCIe ASPM (L0s/L1) globally or for that slot.</li>
                            <li><b>BIOS:</b> pin the slot to a fixed PCIe generation (Gen 3 or 4) instead of Auto: riser signal integrity often can't sustain the negotiated speed.</li>
                            <li><b>BIOS:</b> disable any per-slot / NVMe power management on the M.2 the riser uses.</li>
                        </ul>
                        <div class="gph-aspm">${GpuHealthHtml._aspmRow(aspm)}</div>
                    </div>`;
  }

  static _aspmRow(aspm) {
    const esc = HtmlEscaper.escape;
    if (aspm && aspm.available && aspm.alreadyOff) {
      return '<span class="gpu-health-status ok">PCIe Link State Power Management is already Off</span>';
    }
    if (aspm && aspm.available) {
      return `<span>PCIe Link State Power Management: <b>${esc(aspm.acLabel)}</b> on AC, <b>${esc(aspm.dcLabel)}</b> on battery.</span>
                        <span class="gpu-health-status" data-aspm-status></span>
                        <button class="luma-btn primary luma-btn--sm" data-aspm-off>Set to Off (recommended)</button>`;
    }
    return `<span>Couldn't read the current PCIe power setting${aspm && aspm.reason ? ` (${esc(aspm.reason)})` : ''}, but you can still apply the fix:</span>
                        <span class="gpu-health-status" data-aspm-status></span>
                        <button class="luma-btn primary luma-btn--sm" data-aspm-off>Disable PCIe link power saving</button>`;
  }
}
