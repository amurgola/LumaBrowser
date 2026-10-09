import Unauthorized from './Unauthorized.js';

export default class HostHttp {
  constructor({ fetch, token, win }) {
    this._fetch = fetch;
    this._token = token;
    this._win = win;
  }

  headers(extra) {
    const headers = { ...(extra || {}) };
    const token = this._token.get();
    if (token) headers.Authorization = 'Bearer ' + token;
    return headers;
  }

  fetch(input, init) {
    return this._fetch(input, init);
  }

  authed(input, init) {
    const opts = { ...(init || {}) };
    opts.headers = this.headers(opts.headers);
    return this._fetch(input, opts);
  }

  throwIfUnauthorized(res) {
    if (res.status === 401) throw new Unauthorized(undefined, this._win);
  }

  unauthorized(message) {
    return new Unauthorized(message, this._win);
  }
}
