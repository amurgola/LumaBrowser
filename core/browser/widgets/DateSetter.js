const InputDriver = require('../InputDriver');
const KeyInput = require('./KeyInput');
const DateFormatter = require('./DateFormatter');
const FieldScripts = require('./FieldScripts');
const WidgetPage = require('./WidgetPage');

class DateSetter {
  static CALENDAR_HINT = 'This date control only accepts picks from its calendar popup. Open it with click, then pick the day with locate (describe the day cell) or screenshot + click_at.';
  static VALUE_SETTLE_MS = 60;
  static KEYS_SETTLE_MS = 80;

  constructor(wc) {
    this._wc = wc;
  }

  async execute(opts = {}) {
    const parsed = DateFormatter.parseIsoDate(opts.date);
    const invalid = DateSetter._validate(parsed, opts);
    if (invalid) return invalid;
    const info = await WidgetPage.run(this._wc, FieldScripts.inspectDateScript({ ref: opts.ref, selector: opts.selector }));
    if (!info.success) return info;
    const refused = DateSetter._refusal(info);
    if (refused) return refused;
    const native = DateFormatter.nativeDateValue(info.type, parsed);
    if (native) return this._setNative(info, native);
    if (info.readOnly) return { success: false, error: `The date field is read-only. ${DateSetter.CALENDAR_HINT}` };
    return this._setText(info, parsed);
  }

  static _validate(parsed, opts) {
    if (!parsed) return { success: false, error: `date must be an ISO date like 2025-03-15 (got "${opts.date}")` };
    if (opts.ref == null && !opts.selector) return { success: false, error: 'ref or selector is required' };
    return null;
  }

  static _refusal(info) {
    if (!info.isInput) {
      const role = info.role ? ` (role=${info.role})` : '';
      return { success: false, error: `The target is a ${info.tag.toLowerCase()}${role}, not a date input. ${DateSetter.CALENDAR_HINT}` };
    }
    if (info.disabled) return { success: false, error: 'the date field is disabled' };
    return null;
  }

  async _setNative(info, native) {
    const set = await WidgetPage.run(this._wc, FieldScripts.setValueScript(native));
    if (!set.success) return set;
    if (set.value !== native) {
      const range = info.min || info.max ? ` (allowed range: ${info.min || 'any'} to ${info.max || 'any'})` : '';
      return { success: false, error: `The ${info.type} field rejected ${native}${range}; it reads "${set.value}"` };
    }
    return { success: true, data: { kind: `native-${info.type}`, value: set.value, verified: true } };
  }

  async _setText(info, parsed) {
    const format = DateFormatter.detectDateFormat({ hints: info.hints, currentValue: info.value, lang: info.lang });
    const text = DateFormatter.formatDate(parsed, format);
    const want = DateFormatter.digitsOf(text);
    const base = { kind: 'text', format: DateFormatter.describeFormat(format), formatSource: format.source, typed: text };
    const byValue = await this._tryValueSet(text, want);
    if (byValue != null) return { success: true, data: { ...base, value: byValue, method: 'value', verified: true } };
    const value = await this._typeKeys(info, text);
    if (DateFormatter.digitsOf(value) === want) return { success: true, data: { ...base, value, method: 'keys', verified: true } };
    return {
      success: false,
      error: `Typed "${text}" (${base.format}, from ${format.source}) but the field reads "${value}". `
        + 'If it expects another format, use type with that exact text. ' + DateSetter.CALENDAR_HINT,
    };
  }

  async _tryValueSet(text, want) {
    const set = await WidgetPage.run(this._wc, FieldScripts.setValueScript(text, { blur: true }));
    if (!set.success) return null;
    await KeyInput.sleep(DateSetter.VALUE_SETTLE_MS);
    const back = await WidgetPage.run(this._wc, FieldScripts.readValueScript());
    return back.success && DateFormatter.digitsOf(back.value) === want ? back.value : null;
  }

  async _typeKeys(info, text) {
    if (info.occluded) await WidgetPage.run(this._wc, FieldScripts.focusTargetScript({ select: true }));
    else await InputDriver.trustedClick(this._wc, info.x, info.y);
    await WidgetPage.run(this._wc, FieldScripts.focusTargetScript({ select: true }));
    await KeyInput.trustedClearField(this._wc);
    await KeyInput.trustedType(this._wc, text);
    await WidgetPage.run(this._wc, FieldScripts.blurTargetScript());
    await KeyInput.sleep(DateSetter.KEYS_SETTLE_MS);
    const back = await WidgetPage.run(this._wc, FieldScripts.readValueScript());
    return back.success ? back.value : '';
  }
}

module.exports = DateSetter;
