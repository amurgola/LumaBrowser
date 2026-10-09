const HtmlToMarkdown = require('../../../shared/content/HtmlToMarkdown');

class ResponseText {
  static SNIFF_CHARS = 2000;

  static isHtml(res) {
    const type = String(res.contentType || '').toLowerCase();
    if (type.includes('html') || type.includes('xml')) return true;
    if (type.includes('json') || type.includes('text/plain') || type.includes('csv')) return false;
    return /<html[\s>]|<!doctype html/i.test(String(res.body || '').slice(0, ResponseText.SNIFF_CHARS));
  }

  static toText(res) {
    if (ResponseText.isHtml(res)) return HtmlToMarkdown.convert(res.body, { baseUrl: res.finalUrl });
    return String(res.body == null ? '' : res.body).replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
}

module.exports = ResponseText;
