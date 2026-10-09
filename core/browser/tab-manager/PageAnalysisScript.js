class PageAnalysisScript {
  static SOURCE = `
(function() {
  try {
    var jsRendered = false;
    var frameworkHints = [];
    var allEls = document.querySelectorAll('*');
    if (document.querySelector('[data-reactroot]') || document.querySelector('[data-reactid]') ||
        document.getElementById('__next') ||
        (document.getElementById('root') && document.getElementById('root').children.length > 0)) {
      frameworkHints.push('React'); jsRendered = true;
    }
    var hasVueAttr = false;
    for (var v = 0; v < Math.min(allEls.length, 200) && !hasVueAttr; v++) {
      for (var va = 0; va < allEls[v].attributes.length; va++) {
        if (allEls[v].attributes[va].name.startsWith('data-v-')) { hasVueAttr = true; break; }
      }
    }
    if (hasVueAttr || document.querySelector('[v-cloak]')) { frameworkHints.push('Vue'); jsRendered = true; }
    var hasNgAttr = false;
    for (var ng = 0; ng < Math.min(allEls.length, 200) && !hasNgAttr; ng++) {
      for (var na = 0; na < allEls[ng].attributes.length; na++) {
        var aName = allEls[ng].attributes[na].name;
        if (aName.startsWith('_nghost') || aName.startsWith('_ngcontent')) { hasNgAttr = true; break; }
      }
    }
    if (hasNgAttr || document.querySelector('[ng-version]') || document.querySelector('app-root')) {
      frameworkHints.push('Angular'); jsRendered = true;
    }
    for (var sv = 0; sv < Math.min(allEls.length, 200); sv++) {
      if (allEls[sv].className && typeof allEls[sv].className === 'string' && /svelte-[a-z0-9]+/.test(allEls[sv].className)) {
        frameworkHints.push('Svelte'); jsRendered = true; break;
      }
    }
    var noscripts = document.querySelectorAll('noscript');
    for (var n = 0; n < noscripts.length; n++) {
      var nsText = noscripts[n].textContent.toLowerCase();
      if (nsText.includes('javascript') || nsText.includes('enable')) { jsRendered = true; break; }
    }
    var sampleSize = Math.min(allEls.length, 500);
    var totalClassNames = 0, hashedCount = 0, idsFound = 0, ariaLabelsFound = 0;
    var hashPatterns = [
      /^[a-z]{1,4}[-_][a-z0-9]{4,}$/i,
      /^[A-Z]\\w+__\\w+/,
      /^_[a-z0-9]{5,}$/i,
      /^css-[a-z0-9]+$/i,
      /^[a-z]+-[a-f0-9]{6,}$/i,
      /^sc-[a-z]+$/i,
      /^svelte-[a-z0-9]+$/i
    ];
    for (var i = 0; i < sampleSize; i++) {
      var el = allEls[i];
      if (el.id) idsFound++;
      if (el.getAttribute && el.getAttribute('aria-label')) ariaLabelsFound++;
      if (el.className && typeof el.className === 'string') {
        var classes = el.className.trim().split(/\\s+/).filter(function(c) { return c; });
        for (var j = 0; j < classes.length; j++) {
          totalClassNames++;
          for (var p = 0; p < hashPatterns.length; p++) {
            if (hashPatterns[p].test(classes[j])) { hashedCount++; break; }
          }
        }
      }
    }
    var hashedRatio = totalClassNames > 0 ? hashedCount / totalClassNames : 0;
    var selectorStability = 'stable';
    if (hashedRatio > 0.5) selectorStability = 'unstable';
    else if (hashedRatio > 0.15) selectorStability = 'mixed';
    var navigationStrategy = 'template';
    if (selectorStability === 'unstable') navigationStrategy = 'source';
    else if (selectorStability === 'mixed') navigationStrategy = 'hybrid';
    var requiresScroll = false;
    var pageHeight = document.documentElement.scrollHeight;
    var viewportHeight = window.innerHeight;
    if (pageHeight > viewportHeight * 3) requiresScroll = true;
    var lazyEls = document.querySelectorAll('[loading="lazy"], [data-src], [data-lazy]');
    if (lazyEls.length > 3) requiresScroll = true;
    var tableCount = document.querySelectorAll('table').length;
    var listCount = document.querySelectorAll('ul, ol').length;
    return {
      jsRendered, frameworkHints, requiresScroll, selectorStability, navigationStrategy,
      hashedClassRatio: Math.round(hashedRatio * 100) / 100,
      totalClassNames, hashedCount, idsFound, ariaLabelsFound, sampleSize,
      tableCount, listCount, pageHeight, viewportHeight
    };
  } catch(e) { return { error: e.message }; }
})();`.trim();
}

module.exports = PageAnalysisScript;
