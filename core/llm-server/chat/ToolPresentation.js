const DiffCardPresenter = require('./presentation/DiffCardPresenter');
const ReadCardPresenter = require('./presentation/ReadCardPresenter');

class ToolPresentation {
  static DIFF_BASIS = DiffCardPresenter.BASIS;
  static DIFF_BASIS_MAX_CHARS = DiffCardPresenter.BASIS_MAX_CHARS;

  static PRESENTERS_BY_TOOL = new Map([
    ['edit_file', DiffCardPresenter],
    ['write_file', DiffCardPresenter],
    ['write_extension_file', DiffCardPresenter],
    ['read_file', ReadCardPresenter],
  ]);

  static PRESENTERS_BY_KIND = new Map([DiffCardPresenter, ReadCardPresenter].map((p) => [p.KIND, p]));

  static present(toolName, args, result) {
    const presenter = ToolPresentation.PRESENTERS_BY_TOOL.get(String(toolName));
    if (!presenter) return null;
    try {
      return presenter.present(args || {}, result) || null;
    } catch (_) {
      return null;
    }
  }

  static metaFromEntry(entry) {
    const meta = entry && entry.meta;
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return undefined;
    const presenter = ToolPresentation.PRESENTERS_BY_KIND.get(meta.kind);
    return presenter ? presenter.validate(meta) : undefined;
  }

  static withDiffBasis(result, before, after) {
    return DiffCardPresenter.attachBasis(result, before, after);
  }
}

module.exports = ToolPresentation;
