class ToolCardPresenter {
  static KIND = null;

  static present(_args, _result) {
    throw new Error(`${this.name} must implement present`);
  }

  static validate(_meta) {
    throw new Error(`${this.name} must implement validate`);
  }

  static _failed(result) {
    return !result || result.ok === false || result.success === false;
  }

  static _pathOf(args, result) {
    return result.path || (args && (args.path || args.file_path)) || null;
  }

  static _isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
  }
}

module.exports = ToolCardPresenter;
