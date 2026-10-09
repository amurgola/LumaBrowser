const ToolCardPresenter = require('./ToolCardPresenter');
const LineDiff = require('../../../shared/text/LineDiff');

class DiffCardPresenter extends ToolCardPresenter {
  static KIND = 'diff';
  static BASIS = Symbol.for('luma.tool.diffBasis');
  static BASIS_MAX_CHARS = 256 * 1024;
  static HUNK_LINE_MAX_CHARS = 400;
  static LINE_OPS = [' ', '+', '-'];

  static attachBasis(result, before, after) {
    if (!result || typeof result !== 'object') return result;
    if (DiffCardPresenter._isTooBig(before) || DiffCardPresenter._isTooBig(after)) return result;
    result[DiffCardPresenter.BASIS] = { before: typeof before === 'string' ? before : null, after };
    return result;
  }

  static present(args, result) {
    if (DiffCardPresenter._failed(result)) return null;
    const filePath = DiffCardPresenter._pathOf(args, result);
    const basis = result[DiffCardPresenter.BASIS];
    if (!basis || typeof basis.after !== 'string') return filePath ? DiffCardPresenter._noBasis(filePath, false) : null;
    const created = basis.before === null;
    const diff = LineDiff.diff(created ? '' : basis.before, basis.after);
    if (!diff) return DiffCardPresenter._noBasis(filePath, created);
    return DiffCardPresenter._card(filePath, created, diff);
  }

  static validate(meta) {
    if (!DiffCardPresenter._isNonEmptyString(meta.path)) return undefined;
    if (meta.noBasis) return DiffCardPresenter._noBasis(meta.path, !!meta.created);
    if (!DiffCardPresenter._hasValidCounts(meta)) return undefined;
    if (!Array.isArray(meta.hunks) || !meta.hunks.every((h) => DiffCardPresenter._isValidHunk(h))) return undefined;
    return meta;
  }

  static _card(filePath, created, diff) {
    return {
      kind: DiffCardPresenter.KIND,
      path: filePath,
      created,
      added: diff.added,
      removed: diff.removed,
      truncated: diff.truncated,
      hunks: diff.hunks.map((h) => ({
        oldStart: h.oldStart,
        newStart: h.newStart,
        lines: h.lines.map((l) => ({ op: l.op, text: DiffCardPresenter._clip(l.text) })),
      })),
    };
  }

  static _noBasis(filePath, created) {
    return { kind: DiffCardPresenter.KIND, path: filePath, created, noBasis: true };
  }

  static _hasValidCounts(meta) {
    return Number.isInteger(meta.added) && Number.isInteger(meta.removed) && meta.added >= 0 && meta.removed >= 0;
  }

  static _isValidHunk(hunk) {
    if (!hunk || !Array.isArray(hunk.lines)) return false;
    if (!Number.isInteger(hunk.oldStart) || !Number.isInteger(hunk.newStart)) return false;
    return hunk.lines.every((l) => !!l && typeof l.text === 'string' && DiffCardPresenter.LINE_OPS.includes(l.op));
  }

  static _clip(text) {
    const max = DiffCardPresenter.HUNK_LINE_MAX_CHARS;
    return typeof text === 'string' && text.length > max ? `${text.slice(0, max)}…` : text;
  }

  static _isTooBig(text) {
    return typeof text === 'string' && text.length > DiffCardPresenter.BASIS_MAX_CHARS;
  }
}

module.exports = DiffCardPresenter;
