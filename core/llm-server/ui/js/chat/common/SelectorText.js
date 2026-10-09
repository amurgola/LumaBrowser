export default class SelectorText {
  static attrValue(s) {
    return String(s).replace(/["\\\]]/g, '\\$&');
  }
}
