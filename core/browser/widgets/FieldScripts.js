const WidgetScript = require('./WidgetScript');

class FieldScripts {
  static inspectDateScript({ ref, selector }) {
    return WidgetScript.wrap('inspectDate', `
    __clearMarks();
    var f = __find(${JSON.stringify(WidgetScript.refArg(ref))}, ${JSON.stringify(selector || null)});
    if (f.error) return { success: false, error: f.error };
    var el = f.el;
    var input = null;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') input = el;
    else if (el.tagName === 'LABEL' && el.control) input = el.control;
    else input = el.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio])');
    if (!input) {
      return { success: true, isInput: false, tag: el.tagName, role: el.getAttribute('role') || '', text: __name(el).slice(0, 80) };
    }
    input.setAttribute('data-luma-widget-target', '1');
    var hints = [];
    ['placeholder', 'aria-placeholder', 'aria-label', 'title', 'data-format', 'data-date-format', 'data-mask', 'data-inputmask', 'data-inputmask-inputformat'].forEach(function(a) {
      var v = input.getAttribute(a);
      if (v) hints.push(v);
    });
    if (input.labels && input.labels.length) hints.push(__norm(input.labels[0].innerText));
    var desc = input.getAttribute('aria-describedby');
    if (desc) desc.split(/\\s+/).forEach(function(id) { var n = document.getElementById(id); if (n) hints.push(__norm(n.innerText)); });
    var p = __point(input);
    return {
      success: true, isInput: true,
      type: (input.getAttribute('type') || 'text').toLowerCase(),
      readOnly: !!input.readOnly, disabled: !!input.disabled,
      value: input.value, hints: hints,
      min: input.getAttribute('min'), max: input.getAttribute('max'),
      lang: document.documentElement.lang || navigator.language || '',
      x: p.x, y: p.y, occluded: p.occluded,
    };
  `);
  }

  static inspectSliderScript({ ref, selector }) {
    return WidgetScript.wrap('inspectSlider', `
    __clearMarks();
    var f = __find(${JSON.stringify(WidgetScript.refArg(ref))}, ${JSON.stringify(selector || null)});
    if (f.error) return { success: false, error: f.error };
    var el = f.el;
    var range = null;
    if (el.tagName === 'INPUT' && (el.type || '').toLowerCase() === 'range') range = el;
    else if (el.tagName === 'LABEL' && el.control && el.control.type === 'range') range = el.control;
    else range = el.querySelector('input[type=range]');
    if (range) {
      range.setAttribute('data-luma-widget-target', '1');
      var stepAttr = range.getAttribute('step');
      return {
        success: true, kind: 'range',
        min: range.min !== '' ? Number(range.min) : 0,
        max: range.max !== '' ? Number(range.max) : 100,
        step: stepAttr === 'any' ? 0 : (stepAttr ? Number(stepAttr) : 1),
        value: Number(range.value), disabled: range.disabled,
      };
    }
    var s = el.getAttribute('role') === 'slider' ? el : el.querySelector('[role=slider]');
    if (!s) return { success: false, error: 'the target is not a slider (no input[type=range] or role="slider" found)' };
    s.setAttribute('data-luma-widget-target', '1');
    var num = function(a, d) { var v = s.getAttribute(a); return v != null && v !== '' && !isNaN(Number(v)) ? Number(v) : d; };
    var orientation = s.getAttribute('aria-orientation') || 'horizontal';
    var p = __point(s);
    var tr = s.getBoundingClientRect();
    var track = null;
    var n = s.parentElement;
    for (var i = 0; n && i < 6; i++, n = n.parentElement) {
      var r = n.getBoundingClientRect();
      var ok = orientation === 'vertical' ? r.height >= tr.height * 3 : r.width >= tr.width * 3;
      if (ok) { track = { left: r.left, top: r.top, width: r.width, height: r.height }; break; }
    }
    return {
      success: true, kind: 'aria',
      min: num('aria-valuemin', 0), max: num('aria-valuemax', 100), now: num('aria-valuenow', null),
      orientation: orientation, disabled: s.getAttribute('aria-disabled') === 'true',
      x: p.x, y: p.y, occluded: p.occluded, track: track,
    };
  `);
  }

  static setValueScript(value, { blur = false } = {}) {
    return WidgetScript.wrap('setValue', `
    var el = document.querySelector('[data-luma-widget-target]');
    if (!el) return { success: false, error: 'the field vanished before it could be set' };
    try { el.focus(); } catch (_) {}
    __setNative(el, ${JSON.stringify(String(value))});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (${JSON.stringify(!!blur)}) { try { el.blur(); } catch (_) {} }
    return { success: true, value: el.value };
  `);
  }

  static readValueScript() {
    return WidgetScript.wrap('readValue', `
    var el = document.querySelector('[data-luma-widget-target]');
    if (!el) return { success: false, error: 'the field vanished' };
    var now = el.getAttribute('aria-valuenow');
    return {
      success: true,
      value: el.value != null ? String(el.value) : null,
      now: now != null && now !== '' ? Number(now) : null,
      valueText: el.getAttribute('aria-valuetext') || null,
    };
  `);
  }

  static focusTargetScript({ select = false } = {}) {
    return WidgetScript.wrap('focusTarget', `
    var el = document.querySelector('[data-luma-widget-target]');
    if (!el) return { success: false, error: 'the field vanished' };
    try { el.focus(); } catch (_) {}
    if (${JSON.stringify(!!select)} && typeof el.select === 'function') { try { el.select(); } catch (_) {} }
    return { success: true, focused: document.activeElement === el };
  `);
  }

  static blurTargetScript() {
    return WidgetScript.wrap('blurTarget', `
    var el = document.querySelector('[data-luma-widget-target]');
    if (el) { try { el.blur(); } catch (_) {} }
    return { success: true, value: el ? el.value : null };
  `);
  }
}

module.exports = FieldScripts;
