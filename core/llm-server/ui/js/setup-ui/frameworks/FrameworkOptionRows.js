import HtmlEscaper from '../../format/HtmlEscaper.js';
import DefaultsCardHtml from '../defaults/DefaultsCardHtml.js';
import DefaultsOptions from '../defaults/DefaultsOptions.js';

export default class FrameworkOptionRows {
  static VALUE = Object.freeze({ BOOL: 'bool', NOT: 'not', TEXT: 'text', NUMBER: 'number', OPTIONAL: 'optional' });

  static KV_FULL = 'f16';

  static TOGGLE = 'toggle';

  static CHOICE = 'choice';

  static KNOWN = Object.freeze({
    kvCacheType: { kind: 'choice', value: 'text', label: 'KV cache precision', help: 'kv' },
    maxConcurrent: { kind: 'choice', value: 'number', label: 'Concurrent predictions', help: 'parallel' },
    openvinoDevice: { kind: 'choice', value: 'optional', label: 'OpenVINO device', help: 'openvinoDevice' },
    tensorSplit: { kind: 'toggle', value: 'bool', label: 'Tensor split', caption: 'Split tensors across 2+ NVIDIA GPUs (experimental)', help: 'tensorSplit' },
    noMoeGpuCache: { kind: 'toggle', value: 'not', label: 'MoE GPU cache', caption: 'Cache hot experts in VRAM when a MoE model spills to RAM', help: 'moeGpuCache' },
    cacheReuse: { kind: 'toggle', value: 'bool', label: 'Context retention', caption: 'Keep conversation context reusable in server memory', help: 'cacheReuse' },
    usePeerGpus: { kind: 'toggle', value: 'bool', label: 'Peer GPUs', caption: 'Borrow GPUs from attached network peers', help: 'peerGpus', hintId: 'peerGpusHint' },
    pinModelRam: { kind: 'toggle', value: 'bool', label: 'RAM pin', caption: 'Keep the default model locked in RAM', help: 'ramPin', hintId: 'ramPinHint' },
  });

  static html(framework, context) {
    const drawn = FrameworkOptionRows.shown(framework, context).map((option) => FrameworkOptionRows._row(framework.id, option, context));
    const rows = drawn.filter((d) => !d.isSwitch).map((d) => d.html);
    const switches = drawn.filter((d) => d.isSwitch).map((d) => d.html);
    return rows.join('') + (switches.length ? `<div class="defaults-opt-grid">${switches.join('')}</div>` : '');
  }

  static shown(framework, context) {
    return ((framework && framework.options) || []).filter((option) => {
      if (option.custom) return option.custom.kind === FrameworkOptionRows.TOGGLE || option.custom.kind === FrameworkOptionRows.CHOICE;
      if (!FrameworkOptionRows.KNOWN[option.id]) return false;
      return option.id !== 'pinModelRam' || context.prefs.ramPinSupported();
    });
  }

  static controlId(frameworkId, optionId) {
    return `fw-${frameworkId}-${optionId}`;
  }

  static _attrs(frameworkId, optionId, valueKind) {
    const esc = HtmlEscaper.escape;
    return `data-fw-option="${esc(frameworkId)}:${esc(optionId)}" data-fw-value="${valueKind}"`;
  }

  static _row(frameworkId, option, context) {
    return option.custom
      ? FrameworkOptionRows._customRow(frameworkId, option, context)
      : FrameworkOptionRows._knownRow(frameworkId, option, context);
  }

  static _knownRow(frameworkId, option, context) {
    const known = FrameworkOptionRows.KNOWN[option.id];
    const id = FrameworkOptionRows.controlId(frameworkId, option.id);
    const attrs = FrameworkOptionRows._attrs(frameworkId, option.id, known.value);
    const help = DefaultsCardHtml.HELP[known.help];
    if (known.kind === FrameworkOptionRows.TOGGLE) {
      const checked = known.value === FrameworkOptionRows.VALUE.NOT ? !option.value : !!option.value;
      const hint = known.hintId && context.servesDefault ? ` <span id="${known.hintId}" class="defaults-caption-hint"></span>` : '';
      return { isSwitch: true, html: context.rows.toggle(id, known.label, checked, known.caption + hint, help, attrs) };
    }
    const { choices, current } = FrameworkOptionRows._knownChoices(option, context);
    return { isSwitch: false, html: context.rows.segmented(id, known.label, choices, current, help, attrs) };
  }

  static _knownChoices(option, context) {
    if (option.id === 'maxConcurrent') {
      const parallel = DefaultsOptions.parallelValue({ maxConcurrent: option.value });
      return { choices: DefaultsOptions.parallelOptions(parallel), current: String(parallel) };
    }
    if (option.id === 'openvinoDevice') return { choices: DefaultsOptions.openvinoDeviceOptions(context.npuNames || []), current: option.value || '' };
    const full = FrameworkOptionRows.KV_FULL;
    const choices = DefaultsOptions.KV.map((choice) => (choice.id === '' ? { ...choice, id: full } : choice));
    return { choices, current: FrameworkOptionRows.isKvFull(option.value) ? full : option.value };
  }

  static isKvFull(value) {
    return value == null || value === '' || value === FrameworkOptionRows.KV_FULL;
  }

  static _customRow(frameworkId, option, context) {
    const esc = HtmlEscaper.escape;
    const custom = option.custom;
    const id = FrameworkOptionRows.controlId(frameworkId, option.id);
    const value = option.value == null ? custom.default : option.value;
    const caption = FrameworkOptionRows._captionHtml(custom.caption, option.note);
    if (custom.kind === FrameworkOptionRows.TOGGLE) {
      const attrs = FrameworkOptionRows._attrs(frameworkId, option.id, FrameworkOptionRows.VALUE.BOOL);
      return { isSwitch: true, html: context.rows.toggle(id, esc(custom.label), FrameworkOptionRows.isOn(value), caption, esc(custom.help || ''), attrs) };
    }
    const attrs = FrameworkOptionRows._attrs(frameworkId, option.id, FrameworkOptionRows.VALUE.TEXT);
    const row = context.rows.segmented(id, esc(custom.label), custom.choices, String(value == null ? '' : value), esc(custom.help || ''), attrs);
    return { isSwitch: false, html: row + (caption ? `<div class="fw-option-caption">${caption}</div>` : '') };
  }

  static isOn(value) {
    return value === true || value === 'true';
  }

  static _captionHtml(caption, note) {
    const esc = HtmlEscaper.escape;
    const noteHtml = note && note.text
      ? `<span class="fw-option-note${note.tone === 'warn' ? ' is-warn' : ''}">${esc(note.text)}</span>` : '';
    if (caption && noteHtml) return `${esc(caption)} · ${noteHtml}`;
    return caption ? esc(caption) : noteHtml;
  }
}
