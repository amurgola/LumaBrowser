const SelectorKit = require('./SelectorKit');

class StructuralSummaryScript {
  static SOURCE = `(function() {
  'use strict';
  try {${SelectorKit.HASHED_TOKEN_SRC}
    // The local name every call site below already uses; the predicate itself
    // now lives in SelectorKit so this copy can never drift from TabManager's.
    var isHashedClass = isHashedToken;

    var CONFIG = {
      textCompactMin: 120,
      textCompactSampleChars: 60,
      repeatThreshold: 3,
      keepExemplars: 3,
      sigChildDepth: 2,
      sigChildSampleSize: 10,
      sizeBudgetBytes: 20000,
      attrWhitelist: [
        'id','name','type','role','value','checked','selected',
        'aria-label','aria-labelledby','aria-describedby','aria-hidden',
        'placeholder','href','action','method','for','target','rel',
        'data-testid','data-test','data-qa','data-id','data-cy','data-automation-id',
        'alt','title','tabindex','contenteditable','disabled','readonly'
      ],
      removeTags: ['script','style','noscript','meta','link','template','svg','canvas','iframe','embed','object','picture','source','track','map','area']
    };

    var attrSet = {};
    for (var ai = 0; ai < CONFIG.attrWhitelist.length; ai++) attrSet[CONFIG.attrWhitelist[ai]] = true;
    var removeSet = {};
    for (var ri = 0; ri < CONFIG.removeTags.length; ri++) removeSet[CONFIG.removeTags[ri]] = true;

    function cleanClassList(className) {
      if (!className || typeof className !== 'string') return '';
      var parts = className.trim().split(/\\s+/);
      var kept = [];
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] && !isHashedClass(parts[i])) kept.push(parts[i]);
      }
      return kept.join(' ');
    }

    function isElementHidden(el) {
      if (!el || el.nodeType !== 1) return false;
      if (el.hasAttribute && el.hasAttribute('hidden')) return true;
      if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
      if (el.offsetWidth === 0 && el.offsetHeight === 0 && el.getClientRects && el.getClientRects().length === 0) return true;
      return false;
    }

    function countWords(s) {
      var m = s.match(/\\S+/g);
      return m ? m.length : 0;
    }

    /**
     * Structural signature: tag + filtered classes + child shapes. Used to
     * detect sibling groups that share a layout (repeat groups).
     */
    function computeSignature(el, depth) {
      if (!el || el.nodeType !== 1) return '';
      var sig = el.tagName.toLowerCase();
      var cls = cleanClassList(el.className);
      if (cls) {
        var arr = cls.split(' ').sort();
        sig += '.' + arr.join('.');
      }
      if (depth > 0 && el.children && el.children.length) {
        var parts = [];
        var n = Math.min(el.children.length, CONFIG.sigChildSampleSize);
        for (var i = 0; i < n; i++) {
          parts.push(computeSignature(el.children[i], depth - 1));
        }
        sig += '{' + parts.join(',') + '}';
      }
      return sig;
    }

    /**
     * Identify repeat groups among direct children of el. Returns a map
     * childIndex → { group: signature, keep: boolean, groupSize }.
     */
    function planRepeatGroups(el) {
      var plan = [];
      var groups = {};
      var order = [];
      if (!el.children) return plan;
      for (var i = 0; i < el.children.length; i++) {
        var child = el.children[i];
        if (child.nodeType !== 1) continue;
        var sig = computeSignature(child, CONFIG.sigChildDepth);
        if (!groups[sig]) { groups[sig] = []; order.push(sig); }
        groups[sig].push(i);
      }
      for (var j = 0; j < order.length; j++) {
        var key = order[j];
        var indices = groups[key];
        if (indices.length >= CONFIG.repeatThreshold) {
          var keepSet = {};
          var keepCount = Math.min(CONFIG.keepExemplars, indices.length);
          if (keepCount >= 1) keepSet[indices[0]] = true;
          if (keepCount >= 2) keepSet[indices[indices.length - 1]] = true;
          if (keepCount >= 3) keepSet[indices[Math.floor(indices.length / 2)]] = true;
          for (var k = 0; k < indices.length; k++) {
            plan[indices[k]] = {
              group: key,
              keep: !!keepSet[indices[k]],
              groupSize: indices.length,
              isFirst: indices[k] === indices[0]
            };
          }
        }
      }
      return plan;
    }

    var stats = {
      originalBytes: (document.documentElement.outerHTML || '').length,
      summarizedBytes: 0,
      repeatGroups: 0,
      repeatsOmitted: 0,
      textsCompacted: 0,
      elementsKept: 0,
      elementsSkipped: 0
    };

    var repeats = [];
    var quiet = false;   // when true, renderElement won't mutate stats/repeats (used for zone slicing)

    function shortPathTo(el) {
      var parts = [];
      var cur = el;
      var maxDepth = 6;
      while (cur && cur.nodeType === 1 && cur !== document.documentElement && maxDepth-- > 0) {
        var tag = cur.tagName.toLowerCase();
        // Hashed ids are as unstable as hashed classes; SemanticTreeScript
        // already refuses them here; this copy did not (BUG_BACKLOG M30).
        if (cur.id && !isHashedClass(cur.id)) { parts.unshift(tag + '#' + cur.id); break; }
        var cls = cleanClassList(cur.className).split(' ').filter(Boolean).slice(0, 2);
        if (cls.length) tag += '.' + cls.join('.');
        parts.unshift(tag);
        cur = cur.parentElement;
      }
      return parts.join(' > ');
    }

    function renderAttrs(el) {
      var out = '';
      if (!el.attributes) return out;
      for (var i = 0; i < el.attributes.length; i++) {
        var attr = el.attributes[i];
        var name = attr.name.toLowerCase();
        if (name === 'class') continue;
        if (!attrSet[name]) continue;
        var val = attr.value;
        if (val == null) continue;
        if ((name === 'href' || name === 'src') && typeof val === 'string' && val.indexOf('data:') === 0) continue;
        if (typeof val === 'string' && val.length > 200) val = val.substring(0, 200) + '…';
        out += ' ' + name + '="' + String(val).replace(/"/g, '&quot;').replace(/</g, '&lt;') + '"';
      }
      var cls = cleanClassList(el.className);
      if (cls) out += ' class="' + cls + '"';
      return out;
    }

    var VOID_TAGS = { area:1, base:1, br:1, col:1, embed:1, hr:1, img:1, input:1, link:1, meta:1, param:1, source:1, track:1, wbr:1 };

    function renderElement(el, depth) {
      if (!el || el.nodeType !== 1) return '';
      var tag = el.tagName.toLowerCase();
      if (removeSet[tag]) return '';
      if (isElementHidden(el)) { if (!quiet) stats.elementsSkipped++; return ''; }
      if (!quiet) stats.elementsKept++;

      var attrs = renderAttrs(el);
      if (VOID_TAGS[tag]) {
        return '<' + tag + attrs + '/>';
      }

      var inner = renderChildren(el, depth + 1);
      return '<' + tag + attrs + '>' + inner + '</' + tag + '>';
    }

    function renderText(node) {
      var text = node.nodeValue || '';
      var trimmed = text.replace(/\\s+/g, ' ').trim();
      if (!trimmed) return '';
      if (trimmed.length > CONFIG.textCompactMin) {
        if (!quiet) stats.textsCompacted++;
        var sample = trimmed.substring(0, CONFIG.textCompactSampleChars).replace(/[<>]/g, '');
        return '[TEXT len=' + trimmed.length + ' words=' + countWords(trimmed) + ' sample="' + sample + '…"]';
      }
      return trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function renderChildren(el, depth) {
      var plan = planRepeatGroups(el);
      var out = '';
      var omittedGroupsReported = {};
      var groupsSeen = {};

      for (var i = 0; i < el.childNodes.length; i++) {
        var node = el.childNodes[i];
        if (node.nodeType === 3) {
          out += renderText(node);
          continue;
        }
        if (node.nodeType !== 1) continue;

        // Compute element index among element siblings to look up in plan.
        var elIndex = 0;
        for (var s = 0; s < i; s++) {
          if (el.childNodes[s].nodeType === 1) elIndex++;
        }

        var info = plan[elIndex];
        if (info && !info.keep) {
          // skipped exemplar: emit a marker once per group
          if (!omittedGroupsReported[info.group]) {
            omittedGroupsReported[info.group] = true;
            var omitted = info.groupSize - CONFIG.keepExemplars;
            if (omitted < 1) omitted = 1;
            if (!quiet) stats.repeatsOmitted += omitted;
            out += '<luma-omitted count="' + omitted + '"/>';
          }
          continue;
        }

        if (info && info.isFirst && !groupsSeen[info.group] && !quiet) {
          groupsSeen[info.group] = true;
          stats.repeatGroups++;
          try {
            repeats.push({
              path: shortPathTo(node),
              count: info.groupSize,
              signature: info.group,
              exemplarTag: node.tagName.toLowerCase()
            });
          } catch (e) {}
        }

        out += renderElement(node, depth);
      }
      return out;
    }

    function sliceZone(el) {
      if (!el) return null;
      quiet = true;
      var html = '';
      try { html = renderElement(el, 0); } finally { quiet = false; }
      return { selector: shortPathTo(el), html: html };
    }

    /**
     * Measure an element's rendered contribution to the skeleton without
     * side-effects. Returns 0 for hidden elements and elements that would
     * be empty after stripping.
     */
    function measureCandidate(el) {
      if (!el || el.nodeType !== 1) return 0;
      if (isElementHidden(el)) return 0;
      quiet = true;
      var html = '';
      try { html = renderElement(el, 0); } finally { quiet = false; }
      return html.length;
    }

    /**
     * Pick the best matching zone from a list of selector strings.
     * Iterates every match across every selector, scores them by rendered
     * size, and returns the winner. Prevents the common bug where an early
     * selector match (e.g. a hidden mobile-nav container) wins over a real
     * visible nav later in the document.
     */
    function pickBestZone(selectors, excludeSet) {
      var best = null, bestSize = 0;
      for (var s = 0; s < selectors.length; s++) {
        var matches;
        try { matches = document.querySelectorAll(selectors[s]); } catch (e) { continue; }
        for (var m = 0; m < matches.length; m++) {
          var cand = matches[m];
          if (excludeSet && excludeSet.has && excludeSet.has(cand)) continue;
          var size = measureCandidate(cand);
          if (size > bestSize) { bestSize = size; best = cand; }
        }
      }
      return best;
    }

    /**
     * Synthesize form-like zones when the page has no <form> elements but
     * does have standalone input/button controls (newsletter signups,
     * search bars, "Load more" areas). Groups by nearest meaningful
     * ancestor (container with an id or a stable class) so related
     * controls land together.
     */
    function detectStandaloneControls(excludeSet) {
      var inputs;
      try {
        inputs = document.querySelectorAll(
          'input:not([type="hidden"]), textarea, select, button:not([type="submit"])'
        );
      } catch (e) { return []; }

      var ancestorMap = new Map();
      for (var i = 0; i < inputs.length; i++) {
        var ctrl = inputs[i];
        if (isElementHidden(ctrl)) continue;
        // Skip if inside an existing <form> (already captured) or inside an excluded zone.
        var inForm = false;
        var inExcluded = false;
        var walk = ctrl.parentElement;
        var depth = 0;
        while (walk && depth < 20) {
          if (walk.tagName === 'FORM') { inForm = true; break; }
          if (excludeSet && excludeSet.has && excludeSet.has(walk)) { inExcluded = true; break; }
          walk = walk.parentElement; depth++;
        }
        if (inForm || inExcluded) continue;

        // Climb until we find a container with an id or a semantic-looking class.
        var container = ctrl.parentElement, climb = 0;
        while (container && climb < 6) {
          if (container.id) break;
          var cls = cleanClassList(container.className);
          if (cls && cls.length > 2) break;
          container = container.parentElement; climb++;
        }
        if (!container || container === document.body) container = ctrl.parentElement;
        if (!container) continue;
        if (!ancestorMap.has(container)) ancestorMap.set(container, []);
        ancestorMap.get(container).push(ctrl);
      }

      var synthesized = [];
      ancestorMap.forEach(function (ctrls, container) {
        if (isElementHidden(container)) return;
        var size = measureCandidate(container);
        if (size < 40 || size > 4000) return; // too trivial / too broad
        synthesized.push(sliceZone(container));
      });
      return synthesized;
    }

    function detectZones(root) {
      // No navBottom here: detecting a secondary nav would also have to join the
      // 'exclude' set, which would change what falls out as 'main'. SemanticTreeScript
      // is the extractor that reports navBottom.
      var zones = { navTop: null, main: null, footer: null, sidebar: null, forms: [] };
      var exclude = new Set();

      // Top nav / header: try semantic elements first, but use rendered size to
      // win over hidden drawers that happen to match a selector earlier.
      var header = pickBestZone(['header', '[role="banner"]', 'nav']);
      if (header) { zones.navTop = sliceZone(header); exclude.add(header); }

      // Footer
      var footer = pickBestZone(['footer', '[role="contentinfo"]'], exclude);
      if (footer) { zones.footer = sliceZone(footer); exclude.add(footer); }

      // Main content region
      var main = pickBestZone(
        ['main', '[role="main"]', '#main', '#content', '#root > div', '[data-testid="main"]'],
        exclude,
      );
      if (!main) {
        // Last-resort: largest direct child of body that isn't already a zone.
        var candidates = document.body ? document.body.children : [];
        var best = null; var bestSize = 0;
        for (var c = 0; c < candidates.length; c++) {
          var cand = candidates[c];
          if (exclude.has(cand)) continue;
          var size = measureCandidate(cand);
          if (size > bestSize) { bestSize = size; best = cand; }
        }
        if (best) main = best;
      }
      if (main) { zones.main = sliceZone(main); exclude.add(main); }

      // Sidebar
      var aside = pickBestZone(['aside', '[role="complementary"]'], exclude);
      if (aside) { zones.sidebar = sliceZone(aside); exclude.add(aside); }

      // Real <form> elements first
      var forms;
      try { forms = document.querySelectorAll('form'); } catch (e) { forms = []; }
      for (var f = 0; f < forms.length; f++) {
        if (!isElementHidden(forms[f]) && measureCandidate(forms[f]) > 0) {
          zones.forms.push(sliceZone(forms[f]));
        }
      }
      // Then synthesized pseudo-forms for standalone controls (newsletter
      // signups, search widgets that aren't wrapped in <form>, etc.)
      var synthesized = detectStandaloneControls(exclude);
      for (var si = 0; si < synthesized.length; si++) {
        zones.forms.push(synthesized[si]);
      }
      return zones;
    }

    var root = document.body || document.documentElement;
    var html = renderElement(root, 0);
    stats.summarizedBytes = html.length;

    // Budget enforcement: if we're way over, progressively tighten.
    var attempt = 0;
    while (stats.summarizedBytes > CONFIG.sizeBudgetBytes && attempt < 3) {
      attempt++;
      if (attempt === 1) {
        CONFIG.keepExemplars = 2;
        CONFIG.textCompactMin = 80;
      } else if (attempt === 2) {
        CONFIG.keepExemplars = 1;
        CONFIG.textCompactMin = 40;
        CONFIG.repeatThreshold = 2;
      } else {
        CONFIG.sigChildDepth = 1;
      }
      // Reset stats for re-run
      stats.summarizedBytes = 0;
      stats.repeatGroups = 0;
      stats.repeatsOmitted = 0;
      stats.textsCompacted = 0;
      stats.elementsKept = 0;
      stats.elementsSkipped = 0;
      repeats.length = 0;
      html = renderElement(root, 0);
      stats.summarizedBytes = html.length;
    }
    stats.compactAttempts = attempt;

    var zones = detectZones(root);

    return {
      html: html,
      zones: zones,
      repeats: repeats,
      stats: stats
    };
  } catch(e) {
    return { error: e && e.message ? e.message : String(e), stack: e && e.stack ? e.stack : null };
  }
})();`;
}

module.exports = StructuralSummaryScript;
