const KeyInput = require('./KeyInput');
const OptionMatcher = require('./OptionMatcher');
const SelectScripts = require('./SelectScripts');
const WidgetPage = require('./WidgetPage');
const DropdownOptions = require('./DropdownOptions');

class OptionSelector {
  static OPEN_WAIT_MS = 1500;
  static EDITABLE_OPEN_WAIT_MS = 800;
  static FILTER_WAIT_MS = 2000;
  static FILTER_SETTLE_MS = 200;
  static PICK_SETTLE_MS = 150;
  static DISPLAY_NOTE_CHARS = 80;
  static NO_POPUP_HINT = ' The dropdown did not open a list the page exposes; try click on it, then observe_page or screenshot + click_at.';

  constructor(wc) {
    this._wc = wc;
    this._dropdown = new DropdownOptions(wc);
  }

  async execute(opts = {}) {
    const wanted = OptionSelector._wantedList(opts.option);
    const invalid = OptionSelector._validate(wanted, opts);
    if (invalid) return invalid;
    const info = await WidgetPage.run(this._wc, SelectScripts.inspectSelectScript({ ref: opts.ref, selector: opts.selector }));
    if (!info.success) return info;
    if (info.kind === 'native') return this._selectNative(info, wanted, !!opts.multiple);
    return this._selectCustom(info, wanted);
  }

  static _wantedList(option) {
    if (Array.isArray(option)) return option.map(String).filter((s) => s.trim());
    if (option == null) return [];
    return [String(option)];
  }

  static _validate(wanted, opts) {
    if (!wanted.length) return { success: false, error: 'option is required (the label text or value to pick)' };
    if (opts.ref == null && !opts.selector) return { success: false, error: 'ref or selector is required' };
    return null;
  }

  async _selectNative(info, wanted, keepExisting) {
    if (info.disabled) return { success: false, error: 'the select is disabled' };
    const picked = OptionSelector._pickNative(info, wanted);
    if (picked.error) return { success: false, error: picked.error };
    const applied = await WidgetPage.run(this._wc, SelectScripts.applyNativeSelectScript(picked.indices, keepExisting));
    if (!applied.success) return applied;
    return { success: true, data: OptionSelector._nativeData(info, picked.labels, applied) };
  }

  static _pickNative(info, wanted) {
    const indices = [];
    const labels = [];
    for (const w of wanted) {
      const hit = OptionMatcher.pickOption(info.options, w);
      if (!hit) return { error: `No option matching "${w}". Available options: ${OptionMatcher.describeOptions(info.options)}` };
      indices.push(hit.option.index);
      labels.push(hit.option.label);
    }
    if (indices.length > 1 && !info.multiple) return { error: 'this select allows only one choice; pass a single option' };
    return { indices, labels };
  }

  static _nativeData(info, labels, applied) {
    const verified = labels.every((l) => applied.selected.includes(l));
    return {
      kind: 'native',
      selected: info.multiple ? applied.selected : applied.selected[0],
      value: applied.value,
      verified,
      ...(verified ? {} : { note: 'the page changed the selection back after it was set (a script may be overriding it)' }),
    };
  }

  async _selectCustom(info, wanted) {
    const chosen = [];
    let method = 'input';
    let filtered = false;
    for (const w of wanted) {
      const one = await this._selectOneCustom(info, w);
      if (!one.success) return OptionSelector._partialFailure(one, chosen);
      if (one.label) chosen.push(one.label);
      method = one.method;
      filtered = filtered || one.filtered;
    }
    return this._readBack(info, chosen, method, filtered);
  }

  static _partialFailure(one, chosen) {
    if (!chosen.length) return one;
    return { success: false, error: `${one.error} (already selected: ${chosen.join(', ')})` };
  }

  async _selectOneCustom(info, wanted) {
    let listed = await this._listOrOpen(info);
    if (!listed.success) return listed;
    let { hit, allOptions } = await this._dropdown.find(listed, wanted);
    let filtered = false;
    if ((!hit || hit.score < OptionMatcher.EXACT_LABEL_SCORE) && info.editable) {
      const narrowed = await this._filterFor(wanted);
      if (narrowed.enter) return { success: true, label: null, method: 'enter', filtered: true };
      if (narrowed.typed) {
        filtered = true;
        listed = narrowed.listed;
        if (narrowed.found) {
          hit = narrowed.found.hit;
          if (narrowed.found.allOptions.length) allOptions = narrowed.found.allOptions;
        }
      }
    }
    if (!hit) return this._noMatch(wanted, listed, allOptions);
    return this._pick(hit, filtered);
  }

  async _listOrOpen(info) {
    const listed = await this._dropdown.list();
    if (!listed.success || listed.options.length || info.kind !== 'combobox') return listed;
    await this._dropdown.open(info);
    const timeoutMs = info.editable ? OptionSelector.EDITABLE_OPEN_WAIT_MS : OptionSelector.OPEN_WAIT_MS;
    return this._dropdown.waitForOptions({ timeoutMs });
  }

  async _filterFor(wanted) {
    const typed = await WidgetPage.run(this._wc, SelectScripts.typeFilterScript(wanted));
    if (!typed.success) return { typed: false };
    await KeyInput.sleep(OptionSelector.FILTER_SETTLE_MS);
    const listed = await this._dropdown.waitForOptions({ timeoutMs: OptionSelector.FILTER_WAIT_MS });
    if (listed.success && listed.options.length) {
      return { typed: true, listed, found: await this._dropdown.find(listed, wanted) };
    }
    await KeyInput.trustedKey(this._wc, 'Enter');
    await KeyInput.sleep(OptionSelector.PICK_SETTLE_MS);
    return { typed: true, enter: true };
  }

  async _noMatch(wanted, listed, allOptions) {
    await KeyInput.trustedKey(this._wc, 'Escape');
    const hint = listed.popupCount === 0 && !allOptions.length ? OptionSelector.NO_POPUP_HINT : '';
    return { success: false, error: `No option matching "${wanted}". Available options: ${OptionMatcher.describeOptions(allOptions)}.${hint}` };
  }

  async _pick(hit, filtered) {
    const clicked = await this._dropdown.click(hit.option.index);
    if (!clicked.success) return clicked;
    await KeyInput.sleep(OptionSelector.PICK_SETTLE_MS);
    return { success: true, label: hit.option.label, method: clicked.method, filtered, score: hit.score };
  }

  async _readBack(info, chosen, method, filtered) {
    const back = await WidgetPage.run(this._wc, SelectScripts.readSelectionScript());
    const display = back.success ? back.display : '';
    const verified = OptionSelector._isShowing(chosen, display, back.selectedOptions);
    const data = {
      kind: info.kind,
      selected: chosen.length > 1 ? chosen : (chosen[0] || display || null),
      display,
      method,
      verified,
    };
    if (filtered) data.filtered = true;
    if (!verified) data.note = OptionSelector._unverifiedNote(chosen, display);
    return { success: true, data };
  }

  static _isShowing(chosen, display, selectedOptions) {
    const shown = OptionMatcher.normalize(display);
    return chosen.length > 0 && chosen.every((label) => {
      const wanted = OptionMatcher.normalize(label);
      return shown.includes(wanted) || (selectedOptions || []).some((s) => OptionMatcher.normalize(s) === wanted);
    });
  }

  static _unverifiedNote(chosen, display) {
    if (!chosen.length) return 'selected with Enter after filtering; confirm with observe_page or screenshot';
    return `the option was clicked but the dropdown now shows "${display.slice(0, OptionSelector.DISPLAY_NOTE_CHARS)}"; confirm with observe_page or screenshot`;
  }
}

module.exports = OptionSelector;
