import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import DiagnosticsText from './DiagnosticsText.js';

export default class MemoryCard {
  static render(doc, mem) {
    const total = mem.totalBytes;
    const used = total - mem.freeBytes;
    doc.getElementById('memPill').textContent = MemoryCard.pillText(mem);
    const body = doc.getElementById('memBody');
    body.className = '';
    body.innerHTML = MemoryCard._headHtml(total, used, mem.freeBytes) + MemoryCard._modulesHtml(mem.modules);
  }

  static pillText(mem) {
    const speeds = ((mem.modules && mem.modules.modules) || []).map((m) => m.configuredSpeedMTs || m.speedMTs).filter(Boolean);
    const fmt = ByteFormatter.bytes;
    return speeds.length > 0 ? `${fmt(mem.totalBytes)} · ${Math.max(...speeds)} MT/s` : fmt(mem.totalBytes);
  }

  static _headHtml(total, used, free) {
    const fmt = ByteFormatter.bytes;
    return `
                <div class="kv-list">
                    <div class="kv-row"><span class="kv-key">Installed</span><span class="kv-val">${fmt(total)}</span></div>
                    <div class="kv-row"><span class="kv-key">In use</span><span class="kv-val">${fmt(used)} (${DiagnosticsText.pct(used, total)})</span></div>
                    <div class="kv-row"><span class="kv-key">Free</span><span class="kv-val">${fmt(free)}</span></div>
                </div>
                <div class="luma-progress"><div class="luma-progress-fill" style="width:${(used / total) * 100}%"></div></div>
            `;
  }

  static _modulesHtml(modules) {
    const esc = HtmlEscaper.escape;
    if (modules && modules.available && Array.isArray(modules.modules) && modules.modules.length > 0) {
      return `
                    <div class="mem-modules">
                        <div class="mem-modules-title">Modules (${modules.modules.length})</div>
                        ${modules.modules.map(MemoryCard._moduleHtml).join('')}
                    </div>
                `;
    }
    if (modules && modules.reason) {
      return `
                    <div class="mem-modules">
                        <div class="mem-modules-title">Modules</div>
                        <div style="font-size:11.5px;color:var(--text-muted);">${esc(modules.reason)}</div>
                    </div>
                `;
    }
    return '';
  }

  static _moduleHtml(m) {
    const esc = HtmlEscaper.escape;
    const speed = m.configuredSpeedMTs || m.speedMTs;
    const meta = [m.memoryType, m.formFactor, m.deviceLocator, m.manufacturer, m.partNumber].filter(Boolean).join(' · ');
    return `
                                <div class="mem-module">
                                    <div>
                                        <div>${esc(ByteFormatter.bytes(m.capacityBytes))}</div>
                                        <div class="mem-module-meta">${esc(meta || 'n/a')}</div>
                                    </div>
                                    <div class="mem-module-speed">${esc(speed ? `${speed} MT/s` : 'n/a')}</div>
                                </div>
                            `;
  }
}
