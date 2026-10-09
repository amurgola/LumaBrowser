const WidgetScript = require('./WidgetScript');

class SelectScripts {
  static POPUP_SEL = [
    '[role="listbox"]', '[role="menu"]', '[role="tree"]',
    '.ant-select-dropdown', '.MuiAutocomplete-popper', '.MuiPopover-paper', '.MuiMenu-paper',
    '.cdk-overlay-pane', '[class*="__menu"]', '[data-radix-popper-content-wrapper]',
    '.select2-results', '.chosen-drop', '[cmdk-list]',
  ].join(',');

  static OPTION_SEL = [
    '[role="option"]', '[role="menuitem"]', '[role="menuitemradio"]', '[role="menuitemcheckbox"]',
    '[role="treeitem"]', '.ant-select-item-option', '[class*="__option"]', 'mat-option',
    '.select2-results__option', '.chosen-results li', '[cmdk-item]',
  ].join(',');

  static inspectSelectScript({ ref, selector }) {
    return WidgetScript.wrap('inspectSelect', `
    __clearMarks();
    var f = __find(${JSON.stringify(WidgetScript.refArg(ref))}, ${JSON.stringify(selector || null)});
    if (f.error) return { success: false, error: f.error };
    var el = f.el;
    var native = null;
    if (el.tagName === 'SELECT') native = el;
    else if (el.tagName === 'LABEL' && el.control && el.control.tagName === 'SELECT') native = el.control;
    else if (!el.matches('[role=combobox],[role=listbox],[aria-haspopup]') && !el.querySelector('[role=combobox],[role=listbox]')) {
      native = el.querySelector('select');
    }
    if (native) {
      native.setAttribute('data-luma-widget-target', '1');
      var opts = Array.prototype.slice.call(native.options, 0, 1000).map(function(o) {
        var group = o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement : null;
        return { index: o.index, label: __norm(o.label || o.textContent), value: o.value, disabled: !!(o.disabled || (group && group.disabled)), selected: o.selected };
      });
      return { success: true, kind: 'native', multiple: native.multiple, disabled: native.disabled, options: opts };
    }
    var trigger = (el.tagName === 'LABEL' && el.control) ? el.control : el;
    var role = (trigger.getAttribute('role') || '').toLowerCase();
    if (role === 'option' || role === 'menuitem') {
      return { success: false, error: 'the target is a single option, not the dropdown; pass the dropdown itself (its combobox or button), or click the option directly' };
    }
    document.querySelectorAll(${JSON.stringify(SelectScripts.POPUP_SEL)}).forEach(function(p) {
      if (__visible(p) && p !== trigger) p.setAttribute('data-luma-prepopup', '1');
    });
    trigger.setAttribute('data-luma-widget-target', '1');
    if (role === 'listbox' || role === 'menu' || role === 'tree') {
      return { success: true, kind: 'listbox', multiselectable: trigger.getAttribute('aria-multiselectable') === 'true' };
    }
    var input = null;
    var isText = function(n) {
      if (!n) return false;
      if (n.tagName === 'TEXTAREA') return !n.readOnly && !n.disabled;
      if (n.tagName !== 'INPUT') return false;
      var t = (n.getAttribute('type') || 'text').toLowerCase();
      return (t === 'text' || t === 'search') && !n.readOnly && !n.disabled;
    };
    if (isText(trigger)) input = trigger;
    else {
      var cands = trigger.querySelectorAll('input, textarea');
      for (var i = 0; i < cands.length; i++) { if (isText(cands[i])) { input = cands[i]; break; } }
    }
    if (input) input.setAttribute('data-luma-widget-input', '1');
    var cb = trigger.matches('[role=combobox]') ? trigger : trigger.querySelector('[role=combobox]');
    var expanded = (cb || trigger).getAttribute('aria-expanded') === 'true';
    var p = __point(trigger);
    return { success: true, kind: 'combobox', editable: !!input, expanded: expanded, x: p.x, y: p.y, occluded: p.occluded, display: __name(trigger) };
  `);
  }

  static applyNativeSelectScript(indices, keepExisting) {
    return WidgetScript.wrap('applyNativeSelect', `
    var sel = document.querySelector('[data-luma-widget-target]');
    if (!sel || sel.tagName !== 'SELECT') return { success: false, error: 'the select element vanished before it could be set' };
    var indices = ${JSON.stringify(indices)};
    if (sel.multiple) {
      if (!${JSON.stringify(!!keepExisting)}) Array.prototype.forEach.call(sel.options, function(o) { o.selected = false; });
      indices.forEach(function(i) { if (sel.options[i]) sel.options[i].selected = true; });
    } else {
      // The native value setter (not a plain assignment) so React's value
      // tracker sees a change and the onChange handler fires.
      __setNative(sel, sel.options[indices[0]].value);
      sel.selectedIndex = indices[0];
    }
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    var chosen = Array.prototype.map.call(sel.selectedOptions, function(o) { return __norm(o.label || o.textContent); });
    return { success: true, selected: chosen, value: sel.value };
  `);
  }

  static collectOptionsScript() {
    return WidgetScript.wrap('collectOptions', `
    var trigger = document.querySelector('[data-luma-widget-target]');
    if (!trigger) return { success: false, error: 'the dropdown vanished (the page re-rendered); observe the page again' };
    document.querySelectorAll('[data-luma-opt]').forEach(function(n) { n.removeAttribute('data-luma-opt'); });
    var POPUP = ${JSON.stringify(SelectScripts.POPUP_SEL)};
    var OPTION = ${JSON.stringify(SelectScripts.OPTION_SEL)};
    var popups = [];
    var role = (trigger.getAttribute('role') || '').toLowerCase();
    if (role === 'listbox' || role === 'menu' || role === 'tree') popups.push(trigger);
    else {
      var holders = [trigger].concat(Array.prototype.slice.call(trigger.querySelectorAll('[aria-controls],[aria-owns]')));
      var anc = trigger.parentElement && trigger.parentElement.closest('[aria-controls],[aria-owns]');
      if (anc) holders.push(anc);
      holders.forEach(function(h) {
        ['aria-controls', 'aria-owns'].forEach(function(a) {
          (h.getAttribute(a) || '').split(/\\s+/).forEach(function(id) {
            var p = id && document.getElementById(id);
            if (p && __visible(p) && popups.indexOf(p) < 0) popups.push(p);
          });
        });
      });
      if (!popups.length) {
        document.querySelectorAll(POPUP).forEach(function(p) {
          if (__visible(p) && !p.hasAttribute('data-luma-prepopup') && !p.contains(trigger)) popups.push(p);
        });
      }
    }
    var opts = [];
    popups.forEach(function(p) {
      p.querySelectorAll(OPTION).forEach(function(o) { if (opts.indexOf(o) < 0 && __visible(o)) opts.push(o); });
    });
    if (!opts.length) {
      popups.forEach(function(p) { p.querySelectorAll('li').forEach(function(o) { if (opts.indexOf(o) < 0 && __visible(o)) opts.push(o); }); });
    }
    if (!opts.length && !popups.length) {
      document.querySelectorAll('[role="option"]').forEach(function(o) {
        if (__visible(o) && !o.closest('[data-luma-prepopup]')) opts.push(o);
      });
    }
    // A match on both a wrapper and its child is one option: keep the outer.
    opts = opts.filter(function(o) { return !opts.some(function(q) { return q !== o && q.contains(o); }); });
    var out = opts.slice(0, 500).map(function(o, i) {
      o.setAttribute('data-luma-opt', String(i));
      return {
        index: i,
        label: __name(o),
        value: o.getAttribute('data-value') || o.getAttribute('value') || '',
        disabled: o.getAttribute('aria-disabled') === 'true' || o.hasAttribute('disabled') || /\\bdisabled\\b/.test(o.className || ''),
        selected: o.getAttribute('aria-selected') === 'true' || o.getAttribute('aria-checked') === 'true',
      };
    });
    return { success: true, options: out, popupCount: popups.length };
  `);
  }

  static scrollOptionsScript({ toTop = false } = {}) {
    return WidgetScript.wrap('scrollOptions', `
    var last = null;
    document.querySelectorAll('[data-luma-opt]').forEach(function(n) { last = n; });
    if (!last) return { success: true, moved: false };
    var s = last.parentElement;
    while (s && s !== document.body) {
      var cs = getComputedStyle(s);
      if (/(auto|scroll|overlay)/.test(cs.overflowY) && s.scrollHeight > s.clientHeight + 2) break;
      s = s.parentElement;
    }
    if (!s || s === document.body) return { success: true, moved: false };
    var before = s.scrollTop;
    s.scrollTop = ${JSON.stringify(!!toTop)} ? 0 : before + Math.max(40, s.clientHeight * 0.8);
    return { success: true, moved: s.scrollTop !== before };
  `);
  }

  static optionPointScript(index) {
    return WidgetScript.wrap('optionPoint', `
    var o = document.querySelector('[data-luma-opt="${Number(index)}"]');
    if (!o) return { success: false, error: 'the option vanished before it could be clicked' };
    var p = __point(o, 'nearest');
    return { success: true, x: p.x, y: p.y, occluded: p.occluded, label: __name(o) };
  `);
  }

  static syntheticOptionClickScript(index) {
    return WidgetScript.wrap('syntheticOptionClick', `
    var o = document.querySelector('[data-luma-opt="${Number(index)}"]');
    if (!o) return { success: false, error: 'the option vanished before it could be clicked' };
    var r = o.getBoundingClientRect();
    var init = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
    try { o.dispatchEvent(new PointerEvent('pointerdown', init)); } catch (_) {}
    o.dispatchEvent(new MouseEvent('mousedown', init));
    try { o.dispatchEvent(new PointerEvent('pointerup', init)); } catch (_) {}
    o.dispatchEvent(new MouseEvent('mouseup', init));
    o.dispatchEvent(new MouseEvent('click', init));
    return { success: true };
  `);
  }

  static typeFilterScript(text) {
    return WidgetScript.wrap('typeFilter', `
    var input = document.querySelector('[data-luma-widget-input]');
    if (!input) return { success: false, error: 'the dropdown has no text input to filter with' };
    try { input.focus(); } catch (_) {}
    __setNative(input, ${JSON.stringify(String(text))});
    var ev;
    try { ev = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: ${JSON.stringify(String(text))} }); }
    catch (_) { ev = new Event('input', { bubbles: true }); }
    input.dispatchEvent(ev);
    return { success: true };
  `);
  }

  static readSelectionScript() {
    return WidgetScript.wrap('readSelection', `
    var trigger = document.querySelector('[data-luma-widget-target]');
    if (!trigger) return { success: true, display: '', gone: true };
    var selectedOpts = [];
    document.querySelectorAll('[data-luma-opt]').forEach(function(o) {
      if (o.getAttribute('aria-selected') === 'true' || o.getAttribute('aria-checked') === 'true') selectedOpts.push(__name(o));
    });
    var parts = [];
    if (trigger.tagName === 'INPUT' || trigger.tagName === 'TEXTAREA') parts.push(trigger.value);
    else {
      parts.push(trigger.innerText || trigger.textContent || '');
      var inp = trigger.querySelector('input:not([type=hidden])');
      if (inp && inp.value) parts.push(inp.value);
      var hidden = trigger.querySelector('input[type=hidden]');
      if (hidden && hidden.value) parts.push(hidden.value);
    }
    var cb = trigger.matches('[role=combobox]') ? trigger : trigger.querySelector('[role=combobox]');
    return {
      success: true,
      display: __norm(parts.join(' ')),
      expanded: !!cb && cb.getAttribute('aria-expanded') === 'true',
      selectedOptions: selectedOpts,
    };
  `);
  }
}

module.exports = SelectScripts;
