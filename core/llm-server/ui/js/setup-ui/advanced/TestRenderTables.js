import HtmlEscaper from '../../format/HtmlEscaper.js';
import PlacementItems from './PlacementItems.js';
import PlacementText from './PlacementText.js';

export default class TestRenderTables {
  static secs(ms) {
    return ms == null ? null : (ms / 1000).toFixed(1) + 's';
  }

  static timingHtml(tm) {
    if (!tm) return '';
    const secs = TestRenderTables.secs;
    const parts = [];
    if (tm.llmDecisionMs != null) parts.push('<span><b>LLM decide</b> ' + secs(tm.llmDecisionMs) + '</span>');
    if (tm.imageLoadMs != null) parts.push('<span><b>img load</b> ' + secs(tm.imageLoadMs) + '</span>');
    if (tm.diffusionMs != null) parts.push(TestRenderTables._diffusion(tm));
    if (tm.tailMs != null) parts.push('<span><b>decode+reply</b> ' + secs(tm.tailMs) + '</span>');
    if (!parts.length) return '';
    return '<div class="adv-timing">' + parts.join('') + '</div>';
  }

  static placementHtml(placement, isAvailable) {
    if (!placement) return '';
    let html = '<div class="adv-lane-meta" style="margin:10px 0 6px">Where each model ran</div>';
    html += '<table class="adv-vram-tbl"><tbody>';
    for (const item of PlacementItems.ITEMS) {
      const s = placement[item.key];
      if (!s || !isAvailable(item.key)) continue;
      html += TestRenderTables._placementRow(item, s);
    }
    return html + '</tbody></table>';
  }

  static vramHtml(vram, isAvailable) {
    if (!vram) return '';
    let html = '<div class="adv-lane-meta" style="margin:10px 0 6px">Peak VRAM / RAM during this run (saved as the model’s footprint)</div>';
    html += '<table class="adv-vram-tbl"><tbody>';
    for (const item of PlacementItems.ITEMS) {
      if (isAvailable(item.key)) html += TestRenderTables._vramRow(item, vram.servers && vram.servers[item.key]);
    }
    html += '</tbody></table>';
    if (!vram.perProcessAvailable) {
      html += '<div class="adv-grid-note">Per-model VRAM unavailable on this GPU/driver (WDDM hides per-process memory): per-GPU peaks below.</div>';
    }
    return html + TestRenderTables._devicesHtml(vram.devices);
  }

  static _diffusion(tm) {
    let d = '<span><b>diffusion</b> ' + TestRenderTables.secs(tm.diffusionMs);
    if (tm.itPerSec != null) d += ' (' + tm.itPerSec.toFixed(1) + ' it/s' + (tm.steps ? ', ' + tm.steps + ' steps' : '') + ')';
    return d + '</span>';
  }

  static _placementRow(item, s) {
    const esc = HtmlEscaper.escape;
    const tags = s.vaeTiling ? ['VAE tiling'] : [];
    return '<tr><td>' + esc(item.label) + '<div class="adv-lane-meta">' + esc(s.modelId || 'unset') + '</div></td>'
      + '<td>' + TestRenderTables._where(s) + (tags.length ? ' <span class="adv-lane-meta">· ' + tags.join(' · ') + '</span>' : '') + '</td></tr>';
  }

  static _where(s) {
    const esc = HtmlEscaper.escape;
    if (s.offloadToCpu) {
      let where = '<span style="color:#f59e0b">System RAM (weights offloaded)</span>';
      if (s.devices && s.devices.length) where += ' · compute on GPU ' + s.devices.join(',');
      return where;
    }
    if (s.devices && s.devices.length) {
      return 'GPU ' + s.devices.join(',') + ' <span class="adv-lane-meta">'
        + esc((s.deviceNames || []).filter(Boolean).map(PlacementText.shortName).join(', ')) + '</span>';
    }
    return '<span class="adv-lane-meta">' + esc(s.state || 'idle') + '</span>';
  }

  static _vramRow(item, srv) {
    const peak = srv && srv.peakBytes;
    const ram = srv && srv.peakRamBytes;
    return '<tr><td><span class="adv-leg-item ' + item.cls + '"><i></i></span>' + HtmlEscaper.escape(item.label) + '</td>'
      + '<td class="num">' + (peak != null ? PlacementText.gb(peak) : 'n/a') + ' VRAM</td>'
      + '<td class="num">' + (ram != null ? PlacementText.gb(ram) : 'n/a') + ' RAM</td></tr>';
  }

  static _devicesHtml(devices) {
    if (!Array.isArray(devices) || !devices.length) return '';
    let html = '<table class="adv-vram-tbl" style="margin-top:8px"><tbody>';
    for (const d of devices) {
      const delta = (d.baselineUsedBytes != null) ? Math.max(0, d.peakUsedBytes - d.baselineUsedBytes) : null;
      html += '<tr><td>GPU ' + d.index + ' <span class="adv-lane-meta">' + HtmlEscaper.escape(PlacementText.shortName(d.name)) + '</span></td>'
        + '<td class="num" colspan="2">peak ' + PlacementText.gb(d.peakUsedBytes) + ' / ' + PlacementText.gb(d.totalBytes)
        + (delta != null ? ' <span class="adv-lane-meta">(+' + PlacementText.gb(delta) + ' over baseline)</span>' : '') + '</td></tr>';
    }
    return html + '</tbody></table>';
  }
}
