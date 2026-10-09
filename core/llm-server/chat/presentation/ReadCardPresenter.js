const ToolCardPresenter = require('./ToolCardPresenter');

class ReadCardPresenter extends ToolCardPresenter {
  static KIND = 'read';

  static present(args, result) {
    if (ReadCardPresenter._failed(result)) return null;
    const filePath = ReadCardPresenter._pathOf(args, result);
    if (!filePath) return null;
    const meta = {
      kind: ReadCardPresenter.KIND,
      path: filePath,
      offset: ReadCardPresenter._positiveInt(result.offset != null ? result.offset : (args && args.offset)),
      lines: ReadCardPresenter._positiveInt(result.lines != null ? result.lines : result.lineCount),
      totalLines: ReadCardPresenter._positiveInt(result.totalLines),
    };
    if (meta.offset === null && meta.lines === null && meta.totalLines === null) return null;
    return meta;
  }

  static validate(meta) {
    if (!ReadCardPresenter._isNonEmptyString(meta.path)) return undefined;
    if (![meta.offset, meta.lines, meta.totalLines].every((v) => ReadCardPresenter._isOptionalPositiveInt(v))) return undefined;
    if (Number.isInteger(meta.offset) && Number.isInteger(meta.totalLines) && meta.offset > meta.totalLines) return undefined;
    return meta;
  }

  static _positiveInt(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  static _isOptionalPositiveInt(value) {
    return value === null || value === undefined || (Number.isInteger(value) && value > 0);
  }
}

module.exports = ReadCardPresenter;
