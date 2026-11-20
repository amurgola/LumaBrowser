class RepeatClickScripts {
  static TARGET_ATTR = 'data-luma-repeat-target';
  static TARGET_SELECTOR = `[${RepeatClickScripts.TARGET_ATTR}]`;
  static CLICKABLE = 'a[href], button, input[type="submit"], input[type="button"], [role="button"], [role="link"], [onclick]';

  static probe({ text = null, selector = null, untilText = null, untilSelector = null, untilUrl = null } = {}) {
    return `
(function() {
  try {
    var ATTR = ${JSON.stringify(RepeatClickScripts.TARGET_ATTR)};
    var CANDIDATES = ${JSON.stringify(selector || RepeatClickScripts.CLICKABLE)};
    var UNTIL_SELECTOR = ${JSON.stringify(untilSelector || null)};

    function fold(s) { return String(s || '').replace(/\\s+/g, ' ').trim().toLowerCase(); }
    var WANT = fold(${JSON.stringify(text || '')});
    var UNTIL_TEXT = fold(${JSON.stringify(untilText || '')});
    var UNTIL_URL = fold(${JSON.stringify(untilUrl || '')});

    function visible(el) {
      if (el.disabled || el.closest('[aria-hidden="true"]')) return false;
      var style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      var r = el.getBoundingClientRect();
      return r.width >= 2 && r.height >= 2;
    }

    function labelsOf(el) {
      return [el.getAttribute('aria-label'), el.tagName === 'INPUT' ? el.value : '', el.textContent].map(fold);
    }

    function findTarget() {
      var containing = null;
      var candidates = document.querySelectorAll(CANDIDATES);
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (!visible(el)) continue;
        if (!WANT) return el;
        var labels = labelsOf(el);
        if (labels.indexOf(WANT) !== -1) return el;
        if (!containing && labels.some(function(label) { return label.indexOf(WANT) !== -1; })) containing = el;
      }
      return containing;
    }

    function anyVisible(css) {
      var matches = document.querySelectorAll(css);
      for (var i = 0; i < matches.length; i++) if (visible(matches[i])) return true;
      return false;
    }

    function reached() {
      if (UNTIL_URL && fold(location.href).indexOf(UNTIL_URL) !== -1) return 'url';
      if (UNTIL_SELECTOR && anyVisible(UNTIL_SELECTOR)) return 'selector';
      if (UNTIL_TEXT && document.body && fold(document.body.innerText).indexOf(UNTIL_TEXT) !== -1) return 'text';
      return null;
    }

    var target = findTarget();
    document.querySelectorAll('[' + ATTR + ']').forEach(function(el) { if (el !== target) el.removeAttribute(ATTR); });
    if (target && !target.hasAttribute(ATTR)) target.setAttribute(ATTR, '1');
    return { success: true, target: !!target, until: reached() };
  } catch (error) { return { success: false, error: error.message }; }
})();`.trim();
  }
}

module.exports = RepeatClickScripts;
