export default class ChromeKind {
  static INTERNAL_KINDS = ['llm', 'dashboard'];

  constructor({ closePopups }) {
    this._closePopups = closePopups;
  }

  static isInternal(kind) {
    return ChromeKind.INTERNAL_KINDS.includes(kind);
  }

  apply(kind) {
    const internal = ChromeKind.isInternal(kind);
    document.body.classList.toggle('is-llm-tab', internal);
    if (internal) this._closePopups();
  }
}
