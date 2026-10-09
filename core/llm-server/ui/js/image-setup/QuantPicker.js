import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class QuantPicker {
  static quantsFor(m) {
    const diffusion = m && m.files && m.files.diffusion;
    return diffusion && Array.isArray(diffusion.quants) && diffusion.quants.length > 1 ? diffusion.quants : null;
  }

  static catalogDefaultId(quants, diffusion) {
    const flagged = quants.find((q) => q && q.default);
    if (flagged) return flagged.id;
    const byFile = diffusion && diffusion.file && quants.find((q) => q.file === diffusion.file);
    return (byFile && byFile.id) || quants[0].id;
  }

  static defaultId(m, vramBytes) {
    const quants = QuantPicker.quantsFor(m);
    if (!quants) return null;
    const fallback = QuantPicker.catalogDefaultId(quants, m.files.diffusion);
    if (vramBytes == null) return fallback;
    let best = null;
    for (const q of quants) {
      if (QuantPicker._fits(q, vramBytes) && (!best || (q.approxBytes || 0) > (best.approxBytes || 0))) best = q;
    }
    return best ? best.id : fallback;
  }

  static totalBytes(m, quantId) {
    if (!m.files) return 0;
    const quants = QuantPicker.quantsFor(m);
    return Object.keys(m.files).reduce((sum, role) => {
      if (role !== 'diffusion') return sum + (m.files[role].approxBytes || 0);
      const quant = quants && quants.find((x) => x.id === quantId);
      return sum + ((quant && quant.approxBytes) || m.files.diffusion.approxBytes || 0);
    }, 0);
  }

  static html(m, vramBytes) {
    const quants = QuantPicker.quantsFor(m);
    if (!quants) return '';
    const esc = HtmlEscaper.escape;
    const selected = QuantPicker.defaultId(m, vramBytes);
    const options = quants.map((q) => QuantPicker._option(q, selected, vramBytes)).join('');
    const note = vramBytes != null
      ? `Detected ~${ByteFormatter.bytes(vramBytes)} usable VRAM. Higher quants above that still run via CPU offload, just slower.`
      : 'VRAM not detected: higher quants may fall back to CPU.';
    return `
      <div class="defaults-row img-quant-row">
        <label for="imgQuant-${esc(m.id)}">Quality</label>
        <select id="imgQuant-${esc(m.id)}" class="img-quant-sel" data-id="${esc(m.id)}">${options}</select>
      </div>
      <div class="img-row-sub img-quant-note">${esc(note)}</div>
    `;
  }

  static selected(id, doc) {
    const select = (doc || document).getElementById(`imgQuant-${id}`);
    return select ? select.value : undefined;
  }

  static _fits(q, vramBytes) {
    return vramBytes == null || !q.recVramBytes || q.recVramBytes <= vramBytes;
  }

  static _option(q, selected, vramBytes) {
    const esc = HtmlEscaper.escape;
    const size = q.approxBytes ? ByteFormatter.bytes(q.approxBytes) : '?';
    const warn = QuantPicker._fits(q, vramBytes) ? '' : ', needs more VRAM';
    return `<option value="${esc(q.id)}"${q.id === selected ? ' selected' : ''}>${esc(q.label || q.id)} · ${size}${warn}</option>`;
  }
}
