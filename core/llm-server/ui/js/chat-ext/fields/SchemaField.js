export default class SchemaField {
  static get types() {
    throw new Error(`${this.name}.types is not implemented`);
  }

  get labelled() {
    return true;
  }

  render(_wrap, _spec) {
    throw new Error(`${this.constructor.name}.render is not implemented`);
  }
}
