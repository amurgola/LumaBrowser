const SelectorKit = require('./SelectorKit');

class SemanticTreeScript {
  static SOURCE = `(function() {
  'use strict';
  try {${SelectorKit.HASHED_TOKEN_SRC}
    // The local name every call site below already uses; the predicate itself
    // now lives in SelectorKit so this copy can never drift from TabManager's.
    var isHashedClass = isHashedToken;

    var CONFIG = {
      textSample: 80,
      classesPerSelector: 2,
      actionableRoles: {
        button: 1, link: 1, tab: 1, menuitem: 1, checkbox: 1, radio: 1,
        switch: 1, combobox: 1, option: 1, searchbox: 1, textbox: 1
      }
    };

    function cleanClasses(el) {
      var raw = el.className;
      if (!raw || typeof raw !== 'string') return [];
      var parts = raw.trim().split(/\\s+/);
      var kept = [];
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] && !isHashedClass(parts[i])) kept.push(parts[i]);
      }
      return kept;
    }

    // Hidden-detection without getComputedStyle, matching StructuralSummaryScript's
    // fast path. Calling getComputedStyle on every element triggers a style
    // recalc per call, adding seconds on pages with 1000+ elements. Checking
    // offsetWidth/offsetHeight + getClientRects covers display:none,
    // visibility:hidden, and off-screen/collapsed elements without the recalc.
    function isHidden(el) {
      if (!el || el.nodeType !== 1) return true;
      if (el.hasAttribute('hidden')) return true;
      if (el.getAttribute('aria-hidden') === 'true') return true;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) {
        var rects = el.getClientRects && el.getClientRects();
        if (!rects || rects.length === 0) return true;
      }
      return false;
    }

    function visibleText(el) {
      var t = (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
      if (t.length > CONFIG.textSample) t = t.substring(0, CONFIG.textSample) + '…';
      return t;
    }

    function escapeAttr(v) {
      return String(v).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
    }

    /**
     * Build the strongest stable CSS selector for an element using ONLY
     * attributes present on the element itself. Does NOT include ancestors:
     * a zone's parent context will already scope the selector when the
     * phase prompt runs the LLM inside a specific zone.
     *
     * Priority:
     *   1. id (if present and not hashed)
     *   2. tag + up-to-2 non-hashed classes + discriminating attr selectors
     *      for links/inputs/buttons
     */
    function buildPrimarySelector(el) {
      var tag = el.tagName.toLowerCase();
      if (el.id && !isHashedClass(el.id)) {
        return '#' + el.id;
      }
      var classes = cleanClasses(el).slice(0, CONFIG.classesPerSelector);
      var sel = tag;
      if (classes.length) sel += '.' + classes.join('.');

      // Strong discriminating attributes per element kind
      if (tag === 'a' && el.getAttribute('href')) {
        var href = el.getAttribute('href');
        // Keep href short; drop fragments that look like session tokens.
        if (href.length <= 120) sel += '[href="' + escapeAttr(href) + '"]';
      } else if (tag === 'input') {
        if (el.getAttribute('name')) sel += '[name="' + escapeAttr(el.getAttribute('name')) + '"]';
        else if (el.getAttribute('placeholder')) sel += '[placeholder="' + escapeAttr(el.getAttribute('placeholder')) + '"]';
        else if (el.getAttribute('type')) sel += '[type="' + escapeAttr(el.getAttribute('type')) + '"]';
      } else if (tag === 'button' || tag === 'textarea' || tag === 'select') {
        if (el.getAttribute('name')) sel += '[name="' + escapeAttr(el.getAttribute('name')) + '"]';
        else if (el.getAttribute('aria-label')) sel += '[aria-label="' + escapeAttr(el.getAttribute('aria-label')) + '"]';
      } else if (el.getAttribute('aria-label')) {
        sel += '[aria-label="' + escapeAttr(el.getAttribute('aria-label')) + '"]';
      } else if (el.getAttribute('role')) {
        sel += '[role="' + escapeAttr(el.getAttribute('role')) + '"]';
      }

      return sel;
    }

    function shortPath(el) {
      var parts = [];
      var cur = el;
      var depth = 0;
      while (cur && cur.nodeType === 1 && cur !== document.documentElement && depth < 6) {
        var t = cur.tagName.toLowerCase();
        if (cur.id && !isHashedClass(cur.id)) { parts.unshift(t + '#' + cur.id); break; }
        var cls = cleanClasses(cur).slice(0, 2);
        if (cls.length) t += '.' + cls.join('.');
        parts.unshift(t);
        cur = cur.parentElement;
        depth++;
      }
      return parts.join(' > ');
    }

    // ── Refs (global across all zones) ─────────────────────────────
    var refCounter = 0;
    var refMap = {};
    function nextRef() { refCounter++; return '@ref' + refCounter; }

    // Single compound selector: let the browser's native selector engine
    // do the actionable filtering in one pass instead of walking every
    // descendant and testing per element.
    var ACTIONABLE_SELECTOR = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="combobox"]',
      '[role="option"]',
      '[role="searchbox"]',
      '[role="textbox"]',
      '[onclick]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    /**
     * Collect actionable elements inside the given root, skipping any that
     * also live inside an element in the excludeElements set. Returns an
     * array of { ref, selector, line, el }.
     */
    function collectActionables(root, excludeElements) {
      if (!root) return [];
      var out = [];
      var matches;
      try { matches = root.querySelectorAll(ACTIONABLE_SELECTOR); } catch (e) { return []; }
      for (var i = 0; i < matches.length; i++) {
        var el = matches[i];
        if (isHidden(el)) continue;
        // Ancestor exclusion: skip elements that live inside a zone already
        // rendered elsewhere. Bounded walk so a malformed detached subtree
        // can't wedge us.
        if (excludeElements && excludeElements.size > 0) {
          var inExcluded = false;
          var walk = el.parentElement;
          var d = 0;
          while (walk && d < 20 && walk !== root) {
            if (excludeElements.has(walk)) { inExcluded = true; break; }
            walk = walk.parentElement; d++;
          }
          if (inExcluded) continue;
        }

        var ref = nextRef();
        var sel = buildPrimarySelector(el);
        var text = visibleText(el);
        refMap[ref] = sel;
        var line = ref + ' | ' + sel + ' | "' + text.replace(/"/g, '\\\\"') + '"';
        out.push({ ref: ref, selector: sel, line: line, el: el });
      }
      return out;
    }

    function renderZone(root, excludeElements) {
      if (!root) return null;
      var items = collectActionables(root, excludeElements);
      return {
        selector: shortPath(root),
        count: items.length,
        lines: items.map(function (it) { return it.line; }).join('\\n'),
      };
    }

    // ── Zone detection (mirrors StructuralSummaryScript's pickBestZone) ───

    function measureZoneSize(el) {
      if (!el || isHidden(el)) return 0;
      // Score = actionable count × 10 + capped visible-text length. Uses the
      // compound selector (fast native path) instead of iterating every
      // descendant node.
      var matches;
      try { matches = el.querySelectorAll(ACTIONABLE_SELECTOR); } catch (e) { return 0; }
      var score = 0;
      for (var i = 0; i < matches.length; i++) {
        var x = matches[i];
        if (isHidden(x)) continue;
        score += 10;
        var t = x.innerText || x.textContent || '';
        score += Math.min(t.length, 40);
      }
      return score;
    }

    function pickBestZone(selectors, excludeSet) {
      var best = null, bestSize = 0;
      for (var s = 0; s < selectors.length; s++) {
        var matches;
        try { matches = document.querySelectorAll(selectors[s]); } catch (e) { continue; }
        for (var m = 0; m < matches.length; m++) {
          var cand = matches[m];
          if (excludeSet && excludeSet.has && excludeSet.has(cand)) continue;
          var size = measureZoneSize(cand);
          if (size > bestSize) { bestSize = size; best = cand; }
        }
      }
      return best;
    }

    function detectZones() {
      var zones = { navTop: null, navBottom: null, footer: null, sidebar: null, main: null, forms: [] };
      var exclude = new Set();

      var header = pickBestZone(['header', '[role="banner"]', 'nav']);
      if (header) { zones.navTop = renderZone(header, null); exclude.add(header); }

      var footer = pickBestZone(['footer', '[role="contentinfo"]'], exclude);
      if (footer) { zones.footer = renderZone(footer, exclude); exclude.add(footer); }

      // Secondary nav (sometimes a distinct <nav> exists for footer/secondary menus)
      var navBottom = pickBestZone(['nav[role="navigation"]', 'nav.secondary', 'nav.footer-nav'], exclude);
      if (navBottom && navBottom !== header) { zones.navBottom = renderZone(navBottom, exclude); exclude.add(navBottom); }

      var sidebar = pickBestZone(['aside', '[role="complementary"]'], exclude);
      if (sidebar) { zones.sidebar = renderZone(sidebar, exclude); exclude.add(sidebar); }

      var main = pickBestZone(
        ['main', '[role="main"]', '#main', '#content', '#main-content', '[data-testid="main"]'],
        exclude,
      );
      if (!main) {
        // Fallback: largest body child by actionable count.
        var candidates = document.body ? document.body.children : [];
        var b = null, bSize = 0;
        for (var c = 0; c < candidates.length; c++) {
          if (exclude.has(candidates[c])) continue;
          var size = measureZoneSize(candidates[c]);
          if (size > bSize) { bSize = size; b = candidates[c]; }
        }
        if (b) main = b;
      }
      if (main) { zones.main = renderZone(main, exclude); exclude.add(main); }

      // Real <form> elements: always included, even if ancestor zones
      // already covered their controls. Phase 3 treats each form as a
      // distinct section ("Search Bar", "Newsletter Signup") and wants
      // them enumerated independently.
      var forms;
      try { forms = document.querySelectorAll('form'); } catch (e) { forms = []; }
      for (var f = 0; f < forms.length; f++) {
        if (isHidden(forms[f])) continue;
        var zone = renderZone(forms[f], null);
        if (zone && zone.count > 0) zones.forms.push(zone);
      }

      return zones;
    }

    var originalBytes = (document.documentElement.outerHTML || '').length;
    var zones = detectZones();

    var slimBytes = 0;
    ['navTop', 'navBottom', 'footer', 'sidebar', 'main'].forEach(function (k) {
      if (zones[k] && zones[k].lines) slimBytes += zones[k].lines.length;
    });
    for (var fi = 0; fi < zones.forms.length; fi++) slimBytes += zones.forms[fi].lines.length;

    return {
      zones: zones,
      refMap: refMap,
      stats: {
        actionableCount: refCounter,
        originalBytes: originalBytes,
        slimBytes: slimBytes,
        compressionRatio: originalBytes > 0 ? +(slimBytes / originalBytes).toFixed(4) : 0,
      },
    };
  } catch (e) {
    return { error: e && e.message ? e.message : String(e), stack: e && e.stack ? e.stack : null };
  }
})();`;
}

module.exports = SemanticTreeScript;
