import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class FatalNotice {
  static show(doc, message) {
    doc.body.innerHTML = '<div style="padding:40px;max-width:520px;margin:0 auto;'
      + 'font-family:system-ui,sans-serif;line-height:1.6">'
      + '<h2 style="margin:0 0 8px">Dashboard unavailable</h2>'
      + '<p>' + HtmlEscaper.escape(message) + '</p></div>';
  }
}
