import HtmlEscaper from '../../format/HtmlEscaper.js';
import DefaultsOptions from './DefaultsOptions.js';

export default class MoreSettingsChips {
  static labels(defaults, prefs) {
    const effort = DefaultsOptions.effortPosition(defaults);
    const parallel = DefaultsOptions.parallelValue(defaults);
    const chips = [];
    if (defaults.kvCacheType) chips.push('KV ' + defaults.kvCacheType);
    if (parallel > 1) chips.push(`${parallel} parallel`);
    if (effort !== 'default') chips.push('Thinking ' + DefaultsOptions.effortLabel(effort).toLowerCase());
    if (prefs.approvalPolicy && prefs.approvalPolicy !== 'auto') chips.push(prefs.approvalPolicy === 'ask' ? 'Always ask' : 'Never ask');
    if (defaults.tensorSplit) chips.push('Tensor split');
    if (defaults.cacheReuse) chips.push('Context retention');
    if (defaults.usePeerGpus) chips.push('Peer GPUs');
    if (defaults.pinModelRam && prefs.ramPinSupported()) chips.push('RAM pin');
    if (defaults.groupRouter) chips.push('Tool router');
    if (prefs.autoUnloadMs > 0) chips.push('Auto-unload');
    if (prefs.unloadOnVramPressure === true) chips.push('Unload on VRAM pressure');
    if ((defaults.launchFlags || '').trim()) chips.push('Extra flags');
    return chips;
  }

  static html(defaults, prefs) {
    return MoreSettingsChips.labels(defaults, prefs).map((c) => `<span class="fold-chip">${HtmlEscaper.escape(c)}</span>`).join('');
  }
}
