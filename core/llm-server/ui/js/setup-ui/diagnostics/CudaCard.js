import HtmlEscaper from '../../format/HtmlEscaper.js';
import DiagnosticsText from './DiagnosticsText.js';
import PathHintBanner from './PathHintBanner.js';
import PcieText from './PcieText.js';

export default class CudaCard {
  static render(doc, cuda) {
    const pill = doc.getElementById('cudaPill');
    const body = doc.getElementById('cudaBody');
    const hintHtml = PathHintBanner.html(cuda);
    body.className = '';
    if (!cuda.available) {
      pill.className = 'luma-badge bad';
      pill.textContent = 'not detected';
      body.innerHTML = CudaCard._missingHtml(hintHtml, cuda);
      return;
    }
    pill.className = 'luma-badge ok';
    pill.textContent = cuda.cudaVersion ? `CUDA ${cuda.cudaVersion}` : 'available';
    body.innerHTML = hintHtml + (cuda.devices || []).map(CudaCard._deviceHtml).join('');
  }

  static _missingHtml(hintHtml, cuda) {
    return `
                    ${hintHtml}
                    <div class="luma-empty">
                        <div>${HtmlEscaper.escape(cuda.reason || 'nvidia-smi did not report any CUDA-capable devices.')}</div>
                        <div style="margin-top:6px;color:var(--text-muted);font-size:11.5px;">
                            Install the latest NVIDIA driver to enable CUDA-backed local LLM runtimes.
                        </div>
                    </div>
                `;
  }

  static _deviceHtml(d) {
    const esc = HtmlEscaper.escape;
    const totalMB = Number(d.memoryTotalMB) || 0;
    const freeMB = Number(d.memoryFreeMB) || 0;
    const usedMB = Math.max(0, totalMB - freeMB);
    return `
                    <div class="gpu-item">
                        <div class="gpu-head">
                            <span class="gpu-name">${esc(d.name || 'NVIDIA GPU')}</span>
                            <span class="luma-badge accent">cc ${esc(d.computeCapability || '?')}</span>
                        </div>
                        <div class="kv-list">
                            <div class="kv-row"><span class="kv-key">Driver</span><span class="kv-val">${esc(d.driverVersion || 'n/a')}</span></div>
                            <div class="kv-row"><span class="kv-key">VRAM total</span><span class="kv-val">${DiagnosticsText.mb(d.memoryTotalMB)}</span></div>
                            <div class="kv-row"><span class="kv-key">VRAM free</span><span class="kv-val">${DiagnosticsText.mb(d.memoryFreeMB)}${totalMB > 0 ? ' (' + Math.round((freeMB / totalMB) * 100) + '%)' : ''}</span></div>
                            ${CudaCard._pcieRow(d.pcie)}
                        </div>
                        ${totalMB > 0 ? `<div class="luma-progress"><div class="luma-progress-fill" style="width:${(usedMB / totalMB) * 100}%"></div></div>` : ''}
                    </div>
                `;
  }

  static _pcieRow(raw) {
    const pcie = PcieText.describe(raw);
    if (!pcie) return '';
    const esc = HtmlEscaper.escape;
    return `
                    <div class="kv-row">
                        <span class="kv-key">PCIe</span>
                        <span class="kv-val">
                            ${esc(pcie.cur || 'n/a')}
                            ${pcie.bw ? `<span class="muted-inline"> · ${esc(pcie.bw)}</span>` : ''}
                            ${pcie.max && pcie.max !== pcie.cur ? `<span class="muted-inline"> · max ${esc(pcie.max)}</span>` : ''}
                        </span>
                    </div>
                `;
  }
}
