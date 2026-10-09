class ImageSrcRecovery {
  static TIMEOUT_MS = 400;

  static SCRIPT = `(function (x, y) {
  var doc = document, el = null;
  for (var depth = 0; depth < 8; depth++) {
    el = doc.elementFromPoint(x, y);
    if (!el) return '';
    if (el.tagName === 'IFRAME' || el.tagName === 'FRAME') {
      var inner = null;
      try { inner = el.contentDocument; } catch (_) { return ''; }
      if (!inner) return '';
      var r = el.getBoundingClientRect();
      x -= r.left + el.clientLeft; y -= r.top + el.clientTop;
      doc = inner;
      continue;
    }
    break;
  }
  var img = el && (el.tagName === 'IMG' ? el : (el.closest && el.closest('img')));
  return (img && (img.currentSrc || img.src)) || '';
})(%X%, %Y%)`;

  static isNeeded(params) {
    return !!params && params.mediaType === 'image' && !params.srcURL;
  }

  static recover(webContents, params) {
    const script = ImageSrcRecovery.scriptFor(params);
    let timer = null;
    const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(''), ImageSrcRecovery.TIMEOUT_MS); });
    return Promise.race([ImageSrcRecovery._run(webContents, script), timeout]).finally(() => clearTimeout(timer));
  }

  static scriptFor(params) {
    const x = Math.round(Number(params.x) || 0);
    const y = Math.round(Number(params.y) || 0);
    return ImageSrcRecovery.SCRIPT.replace('%X%', String(x)).replace('%Y%', String(y));
  }

  static _run(webContents, script) {
    return Promise.resolve()
      .then(() => webContents.executeJavaScript(script, true))
      .then((value) => (typeof value === 'string' ? value : ''))
      .catch(() => '');
  }
}

module.exports = ImageSrcRecovery;
