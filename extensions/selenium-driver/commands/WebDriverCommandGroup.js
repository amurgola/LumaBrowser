class WebDriverCommandGroup {
  constructor(tools) {
    this._tools = tools;
    this._browser = tools.browser;
    this._page = tools.page;
    this._elements = tools.elements;
  }

  commandNames() {
    throw new Error(`${this.constructor.name} must implement commandNames()`);
  }

  static _body(req) {
    return (req && req.body) || {};
  }
}

module.exports = WebDriverCommandGroup;
