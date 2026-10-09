import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class CpuCard {
  static render(doc, cpu) {
    doc.getElementById('cpuPill').textContent = `${cpu.logicalCores} cores`;
    const body = doc.getElementById('cpuBody');
    body.className = 'kv-list';
    body.innerHTML = `
                <div class="kv-row"><span class="kv-key">Model</span><span class="kv-val">${HtmlEscaper.escape(cpu.model || 'Unknown')}</span></div>
                <div class="kv-row"><span class="kv-key">Logical cores</span><span class="kv-val">${cpu.logicalCores}</span></div>
                <div class="kv-row"><span class="kv-key">Base clock</span><span class="kv-val">${cpu.speedMHz ? (cpu.speedMHz / 1000).toFixed(2) + ' GHz' : 'n/a'}</span></div>
            `;
  }
}
