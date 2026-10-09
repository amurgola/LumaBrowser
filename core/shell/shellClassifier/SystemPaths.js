const HostPathSpelling = require('./hostPaths/HostPathSpelling');
const HostPathCatalog = require('./hostPaths/HostPathCatalog');

class SystemPaths {
  static ROOT = 'root';
  static HOME = 'home';
  static SYSTEM = 'system';

  static CONTENTS_GLOBS = Object.freeze(['*', '**', '*.*']);

  static normalize(pathText) {
    return HostPathSpelling.normalize(pathText);
  }

  static classify(pathText) {
    const word = String(pathText ?? '').trim();
    if (!word || word.startsWith('-')) return null;
    const { base, contents } = SystemPaths._splitContents(HostPathSpelling.canonicalize(word));
    const finding = SystemPaths._root(base) || SystemPaths._home(base) || SystemPaths._catalogued(base);
    return finding ? SystemPaths._report(word, base, contents, finding) : null;
  }

  static isRootOrSystemPath(pathText) {
    return SystemPaths.classify(pathText) !== null;
  }

  static isDriveRoot(pathText) {
    const { base } = SystemPaths._splitContents(HostPathSpelling.canonicalize(pathText));
    return SystemPaths._root(base) !== null;
  }

  static _splitContents(canonical) {
    const cut = canonical.lastIndexOf('/');
    const last = canonical.slice(cut + 1);
    if (cut < 0 || !SystemPaths.CONTENTS_GLOBS.includes(last)) return { base: canonical, contents: false };
    return { base: canonical.slice(0, cut) || '/', contents: true };
  }

  static _root(base) {
    if (base === '/') return { kind: SystemPaths.ROOT, place: 'the filesystem root' };
    const drive = /^([a-z]):\/?$/i.exec(base);
    return drive ? { kind: SystemPaths.ROOT, place: `the root of drive ${drive[1].toUpperCase()}:` } : null;
  }

  static _home(base) {
    if (base === '~' || /^~[A-Za-z_][\w.-]*$/.test(base)) return { kind: SystemPaths.HOME, place: 'a home directory' };
    if (base === '~/..' || base.startsWith('~/../')) return { kind: SystemPaths.HOME, place: 'above the home directory' };
    return null;
  }

  static _catalogued(base) {
    const hit = HostPathCatalog.locate(base);
    if (!hit) return null;
    const exact = hit.relation === 'is';
    return { kind: SystemPaths.SYSTEM, place: exact ? hit.location : `inside ${hit.location}`, role: hit.role, exact };
  }

  static _report(word, base, contents, finding) {
    const place = contents ? SystemPaths._contentsPlace(base, finding) : finding.place;
    const role = finding.role ? `, which holds ${finding.role}` : '';
    return { kind: finding.kind, reason: `${word} is ${place}${role}` };
  }

  static _contentsPlace(base, finding) {
    if (!finding.role || finding.exact) return `everything in ${finding.place}`;
    return `everything in ${base}, ${finding.place}`;
  }
}

module.exports = SystemPaths;
