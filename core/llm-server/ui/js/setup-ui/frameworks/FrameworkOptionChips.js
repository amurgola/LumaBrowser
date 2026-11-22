import DefaultsOptions from '../defaults/DefaultsOptions.js';
import FrameworkOptionRows from './FrameworkOptionRows.js';

export default class FrameworkOptionChips {
  static KNOWN = Object.freeze({
    kvCacheType: (value) => (FrameworkOptionRows.isKvFull(value) ? null : `KV ${value}`),
    maxConcurrent: (value) => {
      const parallel = DefaultsOptions.parallelValue({ maxConcurrent: value });
      return parallel > 1 ? `${parallel} parallel` : null;
    },
    openvinoDevice: (value) => (value ? `OpenVINO ${value}` : null),
    tensorSplit: (value) => (value ? 'Tensor split' : null),
    noMoeGpuCache: (value) => (value ? 'MoE GPU cache off' : null),
    cacheReuse: (value) => (value ? 'Context retention' : null),
    usePeerGpus: (value) => (value ? 'Peer GPUs' : null),
    pinModelRam: (value) => (value ? 'RAM pin' : null),
  });

  static labels(options) {
    return (options || []).map(FrameworkOptionChips._label).filter(Boolean);
  }

  static _label(option) {
    if (!option.custom) return FrameworkOptionChips.KNOWN[option.id] ? FrameworkOptionChips.KNOWN[option.id](option.value) : null;
    const custom = option.custom;
    const value = option.value == null ? custom.default : option.value;
    if (custom.kind === FrameworkOptionRows.TOGGLE) {
      const on = FrameworkOptionRows.isOn(value);
      if (on === FrameworkOptionRows.isOn(custom.default)) return null;
      return on ? custom.label : `${custom.label} off`;
    }
    if (String(value) === String(custom.default)) return null;
    const choice = (custom.choices || []).find((candidate) => candidate.id === String(value));
    return `${custom.label} ${choice ? choice.label : value}`;
  }
}
