import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PanelDocuments {
  static APP_BG = '#0b1220';

  static SCROLLBAR_CSS =
    '::-webkit-scrollbar{width:8px;height:8px}'
    + '::-webkit-scrollbar-track{background:transparent}'
    + '::-webkit-scrollbar-thumb{background-color:rgba(245,144,52,0.15);border-radius:4px}'
    + '::-webkit-scrollbar-thumb:hover{background-color:rgba(245,144,52,0.30)}'
    + '::-webkit-scrollbar-corner{background:transparent}'
    + 'html{scrollbar-width:thin;scrollbar-color:rgba(245,144,52,0.15) transparent}';

  static SCROLLBAR_STYLE = '<style data-luma-scrollbar>' + PanelDocuments.SCROLLBAR_CSS + '</style>';

  static building(type, partial) {
    return '<!doctype html>' + PanelDocuments.SCROLLBAR_STYLE + '<body style="margin:0;padding:24px;background:'
      + PanelDocuments.APP_BG + ';'
      + 'color:#8a95ad;font:13px ui-monospace,Menlo,monospace;white-space:pre-wrap;'
      + 'word-break:break-word">'
      + (partial ? HtmlEscaper.escape(partial) : 'Generating ' + HtmlEscaper.escape(type) + '…')
      + '</body>';
  }

  static svg(markup) {
    return '<!doctype html>' + PanelDocuments.SCROLLBAR_STYLE + '<body style="margin:0;display:grid;'
      + 'place-items:center;min-height:100vh;background:' + PanelDocuments.APP_BG + '">' + markup + '</body>';
  }

  static image(b64, mime, loading, errorText) {
    const src = b64 ? 'data:' + mime + ';base64,' + b64 : '';
    const body = PanelDocuments._message(errorText, loading, 'Loading image…') || '<img alt="" src="' + src + '"/>';
    return PanelDocuments._mediaPage('img{max-width:100%;max-height:100%;height:auto;border-radius:10px;'
      + 'box-shadow:0 8px 32px rgba(0,0,0,0.5);}', body);
  }

  static video(b64, mime, loading, errorText) {
    const src = b64 ? 'data:' + (mime || 'video/mp4') + ';base64,' + b64 : '';
    const player = (mime && /^image\//i.test(mime))
      ? '<img alt="" src="' + src + '"/>'
      : '<video src="' + src + '" controls autoplay loop muted playsinline></video>';
    const body = PanelDocuments._message(errorText, loading, 'Loading video…') || player;
    return PanelDocuments._mediaPage('video,img{max-width:100%;max-height:100%;height:auto;border-radius:10px;'
      + 'box-shadow:0 8px 32px rgba(0,0,0,0.5);}', body);
  }

  static audio(b64, mime, loading, errorText) {
    const src = b64 ? 'data:' + (mime || 'audio/wav') + ';base64,' + b64 : '';
    const body = PanelDocuments._message(errorText, loading, 'Loading audio…') || '<audio src="' + src + '" controls></audio>';
    return PanelDocuments._mediaPage('audio{width:100%;max-width:520px;}', body);
  }

  static installScrollbar(frame) {
    if (!frame) return;
    frame.addEventListener('load', () => PanelDocuments._injectScrollbar(frame));
  }

  static _injectScrollbar(frame) {
    let doc = null;
    try { doc = frame.contentDocument; } catch (_) { return; }
    if (!doc || !doc.documentElement) return;
    if (doc.querySelector('style[data-luma-scrollbar]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-luma-scrollbar', '');
    style.textContent = PanelDocuments.SCROLLBAR_CSS;
    const head = doc.head || doc.documentElement;
    head.insertBefore(style, head.firstChild);
  }

  static _message(errorText, loading, loadingText) {
    if (errorText) return '<div class="msg">' + HtmlEscaper.escape(errorText) + '</div>';
    if (loading) return '<div class="msg">' + loadingText + '</div>';
    return '';
  }

  static _mediaPage(mediaCss, body) {
    return '<!doctype html><html><head><meta charset="utf-8">' + PanelDocuments.SCROLLBAR_STYLE + '<style>'
      + 'html,body{margin:0;height:100%;background:' + PanelDocuments.APP_BG + ';color:#8a95ad;'
      + 'font:13px ui-monospace,Menlo,monospace;}'
      + 'body{display:grid;place-items:center;padding:24px;}'
      + mediaCss
      + '.msg{opacity:.7;}'
      + '</style></head><body>' + body + '</body></html>';
  }
}
