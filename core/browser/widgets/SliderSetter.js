const KeyInput = require('./KeyInput');
const FieldScripts = require('./FieldScripts');
const SliderValue = require('./SliderValue');
const WidgetPage = require('./WidgetPage');
const SliderKeyDriver = require('./SliderKeyDriver');

class SliderSetter {
  static FLOAT_TOLERANCE = 1e-9;
  static DRAG_SETTLE_MS = 80;

  constructor(wc) {
    this._wc = wc;
  }

  async execute(opts = {}) {
    const value = Number(opts.value);
    const invalid = SliderSetter._validate(value, opts);
    if (invalid) return invalid;
    const info = await WidgetPage.run(this._wc, FieldScripts.inspectSliderScript({ ref: opts.ref, selector: opts.selector }));
    if (!info.success) return info;
    if (info.disabled) return { success: false, error: 'the slider is disabled' };
    if (info.kind === 'range') return this._setRange(info, value);
    return this._setAria(info, value);
  }

  static _validate(value, opts) {
    if (!Number.isFinite(value)) return { success: false, error: 'value must be a number' };
    if (opts.ref == null && !opts.selector) return { success: false, error: 'ref or selector is required' };
    return null;
  }

  async _setRange(info, value) {
    const target = SliderValue.snap(value, info);
    const set = await WidgetPage.run(this._wc, FieldScripts.setValueScript(String(target)));
    if (!set.success) return set;
    const got = Number(set.value);
    const data = { kind: 'range', value: got, requested: value, min: info.min, max: info.max, verified: Math.abs(got - target) < SliderSetter.FLOAT_TOLERANCE };
    if (target !== value) data.note = `snapped to ${target} (range ${SliderSetter._range(info)}, step ${info.step || 'any'})`;
    return { success: true, data };
  }

  async _setAria(info, value) {
    const target = Math.min(info.max, Math.max(info.min, value));
    if (info.now === target) {
      return { success: true, data: { kind: 'aria', value: info.now, requested: value, min: info.min, max: info.max, method: 'none', verified: true } };
    }
    const keys = await new SliderKeyDriver(this._wc, info, target).execute();
    const moved = keys.moved || !info.track ? { now: keys.now, method: 'keys' } : await this._drag(info, target);
    return SliderSetter._ariaResult(info, value, target, keys, moved);
  }

  async _drag(info, target) {
    const fraction = (target - info.min) / ((info.max - info.min) || 1);
    const track = info.track;
    const to = info.orientation === 'vertical'
      ? { x: info.x, y: Math.round(track.top + track.height * (1 - fraction)) }
      : { x: Math.round(track.left + track.width * fraction), y: info.y };
    await KeyInput.trustedDrag(this._wc, { x: info.x, y: info.y }, to);
    await KeyInput.sleep(SliderSetter.DRAG_SETTLE_MS);
    const read = await WidgetPage.run(this._wc, FieldScripts.readValueScript());
    return { now: read.success ? read.now : null, method: 'drag' };
  }

  static _ariaResult(info, value, target, keys, { now, method }) {
    if (now == null) return { success: false, error: 'the slider has no aria-valuenow to read back; check it with screenshot' };
    if (!keys.moved && method === 'keys') {
      return { success: false, error: `The slider did not respond to arrow keys and has no track to drag along; it reads ${now}. Try locate or screenshot + click_at on the track.` };
    }
    const tolerance = Math.max((info.max - info.min) / 100, SliderSetter.FLOAT_TOLERANCE);
    const verified = Math.abs(now - target) <= (keys.step ? keys.step / 2 : tolerance);
    const data = { kind: 'aria', value: now, requested: value, min: info.min, max: info.max, method, verified };
    if (value !== target) data.note = `clamped to the slider range ${SliderSetter._range(info)}`;
    if (!verified) data.note = `the slider stopped at ${now} (target ${target}); its steps may not land exactly on the target`;
    return { success: true, data };
  }

  static _range(info) {
    return `${info.min} to ${info.max}`;
  }
}

module.exports = SliderSetter;
