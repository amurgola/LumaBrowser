const ActionEvidenceScripts = require('../ActionEvidenceScripts');

class TargetScripts {
  static CLICK_TARGET_ATTR = 'data-luma-click-target';

  static resolve({ selector, text, ref }) {
    const refNum = TargetScripts.refNumber(ref);
    return `
(function() {
  try {
    let target = null;
    const refNum = ${JSON.stringify(refNum)};
    if (refNum != null) {
      target = document.querySelector('[data-luma-ref="' + refNum + '"]');
      if (!target) return { success: false, error: 'ref ' + refNum + ' is not on this page (it may have changed since you observed it); call observe_page again and use a fresh ref' };
    } else {
      const elements = document.querySelectorAll(${JSON.stringify(selector || '')});
      if (elements.length === 0) return { success: false, error: 'No elements found for selector' };
      const filterText = ${JSON.stringify(text || null)};
      if (filterText) {
        for (const el of elements) {
          if (el.textContent.trim().includes(filterText)) { target = el; break; }
        }
        if (!target) return { success: false, error: 'No element matching selector with text: ' + filterText };
      } else {
        target = elements[0];
      }
    }
    document.querySelectorAll('[data-luma-click-target]').forEach((e) => e.removeAttribute('data-luma-click-target'));
    target.setAttribute('data-luma-click-target', '1');
    try { target.scrollIntoView({ block: 'center', inline: 'center' }); } catch (_) {}
    // Before-snapshot for the action evidence, taken AFTER our own
    // scrollIntoView so that scroll is not reported as the action's effect.
    const fp = ${ActionEvidenceScripts.beforeExpr('target')};
    const r = target.getBoundingClientRect();
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + r.height / 2);
    // Occlusion check: real input lands at a POINT, so make sure the point
    // actually belongs to the target (not a sticky header or modal overlay).
    let occluded = false;
    const atPoint = document.elementFromPoint(x, y);
    if (!atPoint || !(atPoint === target || target.contains(atPoint) || atPoint.contains(target))) occluded = true;
    if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) occluded = true;
    return {
      success: true, x, y, occluded, fp,
      tagName: target.tagName,
      text: (target.textContent || '').trim().substring(0, 100),
    };
  } catch (error) { return { success: false, error: error.message }; }
})();`.trim();
  }

  static syntheticClick() {
    return `
(function() {
  try {
    const target = document.querySelector('[data-luma-click-target]');
    if (!target) return { success: false, error: 'click target vanished before the click' };
    target.removeAttribute('data-luma-click-target');
    target.click();
    const focusable = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
    if (focusable.includes(target.tagName) || target.isContentEditable) {
      try { target.focus(); } catch (_) {}
    }
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
})();`.trim();
  }

  static typeValue({ text, clear, submit }) {
    return `
(function() {${TargetScripts.FRAME_FIELD_SRC}
  try {
    const marked = document.querySelector('[data-luma-click-target]');
    if (!marked) return { success: false, error: 'target field vanished before typing' };
    marked.removeAttribute('data-luma-click-target');
    if (marked.tagName === 'SELECT') return { success: false, error: 'target is a <select>; use fill_form with a value instead' };
    const framed = marked.tagName === 'IFRAME' || marked.tagName === 'FRAME';
    const el = framed ? frameField(marked) : marked;
    if (!el) return { success: false, error: 'target frame has no text field this page can reach (it is cross-origin or holds nothing editable)' };
    const tag = el.tagName;
    // The frame's own constructors: its page checks events and values against its own window.
    const view = el.ownerDocument.defaultView || window;
    try { el.focus(); } catch (_) {}
    const value = ${JSON.stringify(String(text))};
    const doClear = ${JSON.stringify(!!clear)};
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      const proto = tag === 'TEXTAREA' ? view.HTMLTextAreaElement.prototype : view.HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      const next = doClear ? value : (el.value || '') + value;
      if (nativeSetter) nativeSetter.call(el, next); else el.value = next;
      el.dispatchEvent(new view.Event('input', { bubbles: true }));
      el.dispatchEvent(new view.Event('change', { bubbles: true }));
    } else if (isEditable(el)) {
      el.textContent = doClear ? value : (el.textContent || '') + value;
      el.dispatchEvent(new view.Event('input', { bubbles: true }));
    } else {
      return { success: false, error: 'target is not a text field (' + tag + ')' };
    }
    let submitted = false;
    if (${JSON.stringify(!!submit)}) {
      const opts = { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true };
      const down = new view.KeyboardEvent('keydown', opts);
      const handledByPage = !el.dispatchEvent(down);
      el.dispatchEvent(new view.KeyboardEvent('keypress', opts));
      el.dispatchEvent(new view.KeyboardEvent('keyup', opts));
      if (!handledByPage && el.tagName === 'INPUT' && el.form) {
        if (typeof el.form.requestSubmit === 'function') el.form.requestSubmit();
        else el.form.submit();
        submitted = true;
      }
    }
    return framed ? { success: true, submitted, field: tag } : { success: true, submitted };
  } catch (error) { return { success: false, error: error.message }; }
})();`.trim();
  }

  static FRAME_FIELD_SRC = `
  function isEditable(node) {
    return !!node && (node.isContentEditable || (node.ownerDocument && node.ownerDocument.designMode === 'on'));
  }
  function isTextField(node) {
    return !!node && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || isEditable(node));
  }
  function frameField(frame) {
    let doc = null;
    try { doc = frame.contentDocument; } catch (_) {}
    if (!doc) return null;
    if (isTextField(doc.activeElement) && doc.activeElement !== doc.body) return doc.activeElement;
    if (isEditable(doc.body)) return doc.body;
    return doc.querySelector('[contenteditable=""], [contenteditable="true"], textarea, input:not([type="hidden"])');
  }`;

  static refNumber(ref) {
    return ref != null && Number.isFinite(Number(ref)) ? Math.trunc(Number(ref)) : null;
  }
}

module.exports = TargetScripts;
