const ActionEvidenceScripts = require('../ActionEvidenceScripts');

class VisionPageScripts {
  static MARKS_HOST_ATTR = 'data-luma-marks';

  static PALETTE = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080', '#f032e6', '#9a6324', '#800000', '#000075'];

  static drawMarksScript(rows) {
    const marks = VisionPageScripts._marks(rows);
    const attr = VisionPageScripts.MARKS_HOST_ATTR;
    return `(function() {
  try {
    var old = document.querySelector('[${attr}]');
    if (old) old.remove();
    var host = document.createElement('div');
    host.setAttribute('${attr}', '1');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;contain:strict;';
    var root = host.attachShadow({ mode: 'closed' });
    var palette = ${JSON.stringify(VisionPageScripts.PALETTE)};
    var marks = ${JSON.stringify(marks)};
    var html = '';
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i], b = m.box, c = palette[m.ref % palette.length];
      // Tag sits above the box's top-left corner, or inside it when the box
      // touches the viewport top.
      var tagTop = b[1] >= 16 ? b[1] - 16 : b[1];
      html += '<div style="position:fixed;left:' + b[0] + 'px;top:' + b[1] + 'px;width:' + b[2] + 'px;height:' + b[3]
        + 'px;border:2px solid ' + c + ';box-sizing:border-box;"></div>'
        + '<div style="position:fixed;left:' + b[0] + 'px;top:' + tagTop + 'px;background:' + c
        + ';color:#fff;font:bold 12px/16px Arial,sans-serif;padding:0 3px;border-radius:2px;">' + m.ref + '</div>';
    }
    root.innerHTML = html;
    (document.body || document.documentElement).appendChild(host);
    return new Promise(function(resolve) {
      // Two frames: one to lay out, one to paint, before capturePage runs.
      requestAnimationFrame(function() { requestAnimationFrame(function() { resolve({ success: true, count: marks.length }); }); });
    });
  } catch (e) { return { success: false, error: e.message }; }
})()`;
  }

  static removeMarksScript() {
    return `(function() {
  var h = document.querySelectorAll('[${VisionPageScripts.MARKS_HOST_ATTR}]');
  for (var i = 0; i < h.length; i++) h[i].remove();
  return true;
})()`;
  }

  static hitTestScript(x, y, { evidence = false } = {}) {
    return `(function() {
  try {
    var x = ${Number(x)}, y = ${Number(y)};
    var vw = window.innerWidth, vh = window.innerHeight;
    var out = { success: true, cssWidth: vw, cssHeight: vh, inView: x >= 0 && y >= 0 && x < vw && y < vh };
    if (!out.inView) return out;
    var el = document.elementFromPoint(x, y);
    ${evidence ? `out.fp = ${ActionEvidenceScripts.beforeExpr('el')};` : ''}
    if (!el) return out;
    var refEl = el.closest('[data-luma-ref]');
    var label = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt')
      || el.placeholder || el.innerText || el.textContent || '';
    out.target = {
      tagName: el.tagName,
      id: el.id || undefined,
      role: el.getAttribute('role') || undefined,
      text: String(label).trim().replace(/\\s+/g, ' ').slice(0, 80),
      ref: refEl ? Number(refEl.getAttribute('data-luma-ref')) : undefined,
      href: (el.closest('a[href]') || {}).href || undefined,
      cursor: getComputedStyle(el).cursor,
      frame: el.tagName === 'IFRAME' ? true : undefined,
    };
    return out;
  } catch (e) { return { success: false, error: e.message }; }
})()`;
  }

  static _marks(rows) {
    return (rows || [])
      .filter((r) => Array.isArray(r.box) && r.box.length === 4)
      .map((r) => ({ ref: r.ref, box: r.box }));
  }
}

module.exports = VisionPageScripts;
