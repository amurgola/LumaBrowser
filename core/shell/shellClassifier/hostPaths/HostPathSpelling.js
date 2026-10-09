const HostPathVariables = require('./HostPathVariables');

class HostPathSpelling {
  static PROVIDER_PREFIX = /^.*filesystem::/i;
  static NAMESPACE_PREFIX = /^\/\/[?.]\/(unc\/)?/i;
  static ADMIN_SHARE = /^\/\/[^/]+\/([a-z])\$(?=\/|$)/i;

  static normalize(pathText) {
    const text = HostPathSpelling.unquote(String(pathText ?? '').trim()).replace(/\\/g, '/');
    return HostPathSpelling._trimTrailingSlashes(text.replace(HostPathSpelling.PROVIDER_PREFIX, ''));
  }

  static canonicalize(pathText) {
    const surface = HostPathSpelling.normalize(pathText);
    const unc = HostPathSpelling._typedAsUnc(pathText);
    const local = HostPathSpelling._toLocalForm(HostPathVariables.expand(surface));
    const collapsed = HostPathSpelling._collapseSlashes(local, unc && local.startsWith('//'));
    return HostPathSpelling._trimTrailingSlashes(HostPathSpelling._resolveDots(collapsed));
  }

  static _typedAsUnc(pathText) {
    return HostPathSpelling.unquote(String(pathText ?? '').trim()).startsWith('\\\\');
  }

  static unquote(text) {
    const quoted = text.length >= 2 && (text[0] === '"' || text[0] === "'") && text.endsWith(text[0]);
    return quoted ? text.slice(1, -1) : text;
  }

  static _toLocalForm(text) {
    const unprefixed = HostPathSpelling.NAMESPACE_PREFIX.test(text)
      ? text.replace(HostPathSpelling.NAMESPACE_PREFIX, (match, unc) => (unc ? '//' : ''))
      : text;
    return unprefixed.replace(HostPathSpelling.ADMIN_SHARE, (match, drive) => `${drive}:`);
  }

  static _collapseSlashes(text, keepUncLead) {
    const collapsed = text.replace(/\/{2,}/g, '/');
    return keepUncLead ? `/${collapsed}` : collapsed;
  }

  static _resolveDots(text) {
    const { anchor, rest } = HostPathSpelling._splitAnchor(text);
    const kept = [];
    for (const segment of rest.split('/')) {
      if (segment === '' || segment === '.') continue;
      if (segment === '..' && kept.length && kept[kept.length - 1] !== '..') kept.pop();
      else if (segment !== '..' || HostPathSpelling._mayClimb(anchor)) kept.push(segment);
    }
    return HostPathSpelling._join(anchor, kept);
  }

  static _mayClimb(anchor) {
    return anchor === '~/' || anchor === '';
  }

  static _splitAnchor(text) {
    const drive = /^[a-z]:\//i.exec(text);
    if (drive) return { anchor: drive[0], rest: text.slice(3) };
    if (text.startsWith('//')) return HostPathSpelling._splitUncAnchor(text);
    if (text.startsWith('/')) return { anchor: '/', rest: text.slice(1) };
    if (text === '~' || text.startsWith('~/')) return { anchor: '~/', rest: text.slice(2) };
    return { anchor: '', rest: text };
  }

  static _splitUncAnchor(text) {
    const share = /^\/\/[^/]+\/[^/]+\/?/.exec(text);
    const anchor = share ? share[0].replace(/\/?$/, '/') : text;
    return { anchor, rest: share ? text.slice(share[0].length) : '' };
  }

  static _join(anchor, segments) {
    const body = segments.join('/');
    if (anchor === '~/') return body ? `~/${body}` : '~';
    if (anchor === '') return body || '.';
    return anchor + body;
  }

  static _trimTrailingSlashes(text) {
    let out = text;
    while (out.length > 1 && out.endsWith('/') && !/^[a-z]:\/$/i.test(out)) out = out.slice(0, -1);
    return out;
  }
}

module.exports = HostPathSpelling;
