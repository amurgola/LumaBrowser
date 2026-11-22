import HtmlEscaper from '../../format/HtmlEscaper.js';
import DefaultsOptions from './DefaultsOptions.js';

export default class MoreSettingsChips {
  static labels(defaults, prefs) {
    const effort = DefaultsOptions.effortPosition(defaults);
    const chips = [];
    if (effort !== 'default') chips.push('Thinking ' + DefaultsOptions.effortLabel(effort).toLowerCase());
    if (prefs.approvalPolicy && prefs.approvalPolicy !== 'auto') chips.push(prefs.approvalPolicy === 'ask' ? 'Always ask' : 'Never ask');
    if (defaults.groupRouter) chips.push('Tool router');
    if (prefs.autoUnloadMs > 0) chips.push('Auto-unload');
    if (prefs.unloadOnVramPressure === true) chips.push('Unload on VRAM pressure');
    if (prefs.vramWarning === false) chips.push('Low VRAM warning off');
    if (prefs.gpuHeadroomBytes != null && prefs.gpuHeadroomBytes !== DefaultsOptions.GIB) {
      chips.push(`${Math.round((prefs.gpuHeadroomBytes / DefaultsOptions.GIB) * 10) / 10} GB GPU headroom`);
    }
    if ((defaults.launchFlags || '').trim()) chips.push('Extra flags');
    return chips;
  }

  static html(defaults, prefs) {
    return MoreSettingsChips.chipsHtml(MoreSettingsChips.labels(defaults, prefs));
  }

  static chipsHtml(labels) {
    return labels.map((c) => `<span class="fold-chip">${HtmlEscaper.escape(c)}</span>`).join('');
  }
}
