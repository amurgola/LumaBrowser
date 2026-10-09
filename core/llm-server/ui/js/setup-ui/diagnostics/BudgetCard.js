import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class BudgetCard {
  static render(doc, budget) {
    const ram = budget.ram || {};
    const vram = budget.vram || {};
    doc.getElementById('budgetPill').textContent = BudgetCard.pillText(ram, vram);
    const body = doc.getElementById('budgetBody');
    body.className = '';
    body.innerHTML = `
                <div class="budget-grid">
                    ${BudgetCard._ramBlock(ram)}
                    <div class="budget-block vram">
                        ${BudgetCard._vramKnown(vram) ? BudgetCard._vramBlock(vram) : BudgetCard._vramUnknown()}
                    </div>
                </div>
            `;
  }

  static pillText(ram, vram) {
    const fmt = ByteFormatter.bytes;
    const ramMax = Number(ram.maxBytes) || 0;
    return BudgetCard._vramKnown(vram)
      ? `${fmt(ramMax)} RAM · ${fmt(Number(vram.maxBytes) || 0)} VRAM`
      : `${fmt(ramMax)} RAM · VRAM unknown`;
  }

  static _vramKnown(vram) {
    return (Number(vram.totalBytes) || 0) > 0;
  }

  static _ramBlock(ram) {
    const fmt = ByteFormatter.bytes;
    return `<div class="budget-block">
                        <div class="budget-headline">
                            <div>
                                <div class="budget-headline-label">RAM available for models</div>
                                <div class="budget-headline-sub">Total ceiling, after OS reserve</div>
                            </div>
                            <div class="budget-headline-value">${fmt(Number(ram.maxBytes) || 0)}</div>
                        </div>
                        <div class="budget-perline">
                            <div class="budget-perline-row"><span>Free right now</span><span><b>${fmt(Number(ram.currentlyFreeBytes) || 0)}</b></span></div>
                            <div class="budget-perline-row"><span>Reserved for host</span><span><b>${fmt(ram.reserveBytes)}</b></span></div>
                            <div class="budget-perline-row"><span>Total installed</span><span><b>${fmt(ram.totalBytes)}</b></span></div>
                        </div>
                        <div class="budget-note">${HtmlEscaper.escape(ram.note || '')}</div>
                    </div>`;
  }

  static _vramBlock(vram) {
    const fmt = ByteFormatter.bytes;
    const now = vram.currentlyFreeBytes != null ? Number(vram.currentlyFreeBytes) : null;
    const perAdapter = BudgetCard._perAdapterHtml(vram.perAdapter || []);
    return `
                            <div class="budget-headline">
                                <div>
                                    <div class="budget-headline-label">VRAM available for models</div>
                                    <div class="budget-headline-sub">Summed across adapters, after per-card reserve</div>
                                </div>
                                <div class="budget-headline-value">${fmt(Number(vram.maxBytes) || 0)}</div>
                            </div>
                            <div class="budget-perline">
                                <div class="budget-perline-row"><span>Free right now</span><span><b>${now != null ? fmt(now) : 'unknown'}</b></span></div>
                                <div class="budget-perline-row"><span>Reserved per adapter</span><span><b>${fmt(vram.reserveBytes)}</b></span></div>
                                <div class="budget-perline-row"><span>Total installed</span><span><b>${fmt(vram.totalBytes)}</b></span></div>
                            </div>
                            ${perAdapter ? `<div class="budget-perline" style="margin-top:10px;border-top:1px dashed var(--border);padding-top:10px;">${perAdapter}</div>` : ''}
                            <div class="budget-note">${HtmlEscaper.escape(vram.note || '')}${!vram.hasFreeData ? ' Free-VRAM is only reported on NVIDIA cards via nvidia-smi.' : ''}</div>
                        `;
  }

  static _perAdapterHtml(adapters) {
    const fmt = ByteFormatter.bytes;
    return adapters.map((a) => `
                <div class="budget-perline-row">
                    <span>${HtmlEscaper.escape(a.name || a.vendor || 'GPU')}</span>
                    <span><b>${fmt(a.maxBytes)}</b>${a.currentlyFreeBytes != null ? ' · ' + fmt(a.currentlyFreeBytes) + ' free' : ''}</span>
                </div>
            `).join('');
  }

  static _vramUnknown() {
    return `
                <div class="budget-headline">
                    <div>
                        <div class="budget-headline-label">VRAM available for models</div>
                        <div class="budget-headline-sub">No adapters reported VRAM</div>
                    </div>
                    <div class="budget-headline-value" style="color:var(--text-muted);">unknown</div>
                </div>
                <details class="budget-note">
                    <summary>Where these come from</summary>
                    VRAM totals come from nvidia-smi (any platform) or, on Windows, the display-adapter registry value <code>HardwareInformation.qwMemorySize</code>. If you have an NVIDIA GPU but nothing shows up, see the CUDA card above: the path-fix flow there will populate VRAM data once nvidia-smi is reachable.
                </details>
            `;
  }
}
