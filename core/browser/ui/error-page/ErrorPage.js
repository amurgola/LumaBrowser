import NetErrorText from './NetErrorText.js';

export default class ErrorPage {
  constructor(win, doc) {
    this._win = win;
    this._doc = doc;
  }

  start() {
    const failure = ErrorPage.parse(this._win.location.search);
    this._render(failure);
    this._wireButtons(failure.url);
  }

  static parse(search) {
    const q = new URLSearchParams(search);
    const url = q.get('url') || '';
    let host = '';
    try { host = new URL(url).hostname; } catch (_) {}
    return { code: parseInt(q.get('code') || '0', 10), url, desc: q.get('desc') || '', host };
  }

  static codeLine(desc, code) {
    if (!desc) return '';
    return desc + (code ? ' (' + code + ')' : '');
  }

  _render({ code, url, desc, host }) {
    const info = NetErrorText.describe(code, desc, host);
    const $ = (id) => this._doc.getElementById(id);
    $('title').textContent = info.title;
    $('message').textContent = info.message;
    $('url').textContent = url;
    for (const h of info.hints) {
      const li = this._doc.createElement('li');
      li.textContent = h;
      $('hints').appendChild(li);
    }
    $('code').textContent = ErrorPage.codeLine(desc, code);
  }

  _wireButtons(url) {
    this._doc.getElementById('reload').addEventListener('click', () => {
      if (url) this._win.location.href = url;
      else this._win.location.reload();
    });
    this._doc.getElementById('back').addEventListener('click', () => this._win.history.back());
  }
}
