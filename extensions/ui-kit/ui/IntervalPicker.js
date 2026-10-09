import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class IntervalPicker {
  static PRESETS = [
    { value: 60000, label: 'Every minute' },
    { value: 300000, label: 'Every 5 minutes' },
    { value: 900000, label: 'Every 15 minutes' },
    { value: 1800000, label: 'Every 30 minutes' },
    { value: 3600000, label: 'Every hour' },
    { value: 21600000, label: 'Every 6 hours' },
    { value: 43200000, label: 'Every 12 hours' },
    { value: 86400000, label: 'Every 24 hours' },
  ];

  static DEFAULT_MS = 3600000;

  static MINUTE_MS = 60000;

  static markup(id, selectedMs) {
    const esc = HtmlEscaper.escape;
    const sel = IntervalPicker._isPreset(selectedMs) ? selectedMs : (selectedMs ? 'custom' : IntervalPicker.DEFAULT_MS);
    const customMinutes = sel === 'custom' ? Math.max(1, Math.round(selectedMs / IntervalPicker.MINUTE_MS)) : 10;
    return `<div class="luma-interval${sel === 'custom' ? ' is-custom' : ''}" id="${esc(id)}">`
      + `<select class="luma-field-select" id="${esc(id)}-select" aria-label="Interval">${IntervalPicker._options(sel)}</select>`
      + `<span class="luma-interval-custom"><input type="number" class="luma-field-input" id="${esc(id)}-custom" min="1" step="1" value="${customMinutes}" aria-label="Custom interval in minutes"><span>min</span></span>`
      + '</div>';
  }

  static bind(root) {
    if (!root) return { get: () => IntervalPicker.DEFAULT_MS, set: () => {} };
    const select = root.querySelector('select');
    const custom = root.querySelector('input[type="number"]');
    const sync = () => root.classList.toggle('is-custom', select.value === 'custom');
    select.addEventListener('change', sync);
    sync();
    return {
      get: () => IntervalPicker._read(select, custom),
      set: (ms) => { IntervalPicker._write(select, custom, ms); sync(); },
    };
  }

  static format(ms) {
    const preset = IntervalPicker.PRESETS.find((p) => p.value === ms);
    if (preset) return preset.label.replace(/^Every /, 'every ');
    if (!ms) return '';
    if (ms < 60000) return `every ${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `every ${Math.round(ms / 60000)} min`;
    const hours = ms / 3600000;
    return `every ${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
  }

  static _isPreset(ms) {
    return IntervalPicker.PRESETS.some((p) => p.value === ms);
  }

  static _options(sel) {
    return IntervalPicker.PRESETS.map((p) =>
      `<option value="${p.value}"${p.value === sel ? ' selected' : ''}>${HtmlEscaper.escape(p.label)}</option>`).join('')
      + `<option value="custom"${sel === 'custom' ? ' selected' : ''}>Custom</option>`;
  }

  static _read(select, custom) {
    if (select.value === 'custom') return Math.max(1, parseInt(custom.value, 10) || 1) * IntervalPicker.MINUTE_MS;
    return parseInt(select.value, 10) || IntervalPicker.DEFAULT_MS;
  }

  static _write(select, custom, ms) {
    if (IntervalPicker._isPreset(ms)) {
      select.value = String(ms);
      return;
    }
    select.value = 'custom';
    custom.value = String(Math.max(1, Math.round((ms || 600000) / IntervalPicker.MINUTE_MS)));
  }
}
