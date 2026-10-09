const ConfigValue = require('./ConfigValue');
const KeyPath = require('./KeyPath');

class ConfigDocument {
  static BOM = '﻿';

  static open(text) {
    return new this(text);
  }

  constructor(text) {
    const source = text == null ? '' : text;
    this._bom = source.startsWith(ConfigDocument.BOM) ? ConfigDocument.BOM : '';
    const body = source.slice(this._bom.length);
    this._text = body.trim() === '' ? this.constructor.EMPTY : body;
    this._data = this._parse(this._text);
    this._edited = false;
  }

  data() {
    return this._data;
  }

  readPath(path) {
    return KeyPath.lookup(this._data, path);
  }

  edited() {
    return this._edited;
  }

  isBlank() {
    return this._text.trim() === this.constructor.EMPTY.trim();
  }

  set(path, value) {
    const current = this.readPath(path);
    if (current.present && ConfigValue.same(current.value, value)) return;
    this._replaceText(this._textWith(path, value));
    this._confirm(path, { present: true, value });
  }

  remove(path) {
    if (!this.readPath(path).present) return;
    this._replaceText(this._textWithout(path));
    this._confirm(path, { present: false });
  }

  toString() {
    return this._bom + this._text;
  }

  _parse(text) {
    throw new Error(`${this.constructor.name} must implement _parse(text)`);
  }

  _textWith(path, value) {
    throw new Error(`${this.constructor.name} must implement _textWith(path, value)`);
  }

  _textWithout(path) {
    throw new Error(`${this.constructor.name} must implement _textWithout(path)`);
  }

  _replaceText(text) {
    this._data = this._parse(text);
    this._text = text;
    this._edited = true;
  }

  _confirm(path, expected) {
    const actual = this.readPath(path);
    const landed = actual.present === expected.present && (!expected.present || ConfigValue.same(actual.value, expected.value));
    if (!landed) throw new Error(`Could not safely edit ${KeyPath.label(path)}; the file was left unchanged.`);
  }
}

module.exports = ConfigDocument;
