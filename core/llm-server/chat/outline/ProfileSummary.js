const BoundedJson = require('./BoundedJson');
const StringPreview = require('./StringPreview');
const ValueKind = require('./ValueKind');
const CountPhrase = require('./CountPhrase');
const JsonPath = require('./JsonPath');

class ProfileSummary {
  static INLINE_CHARS = 120;
  static EXAMPLE_CHARS = 160;
  static VALUE = ' = ';
  static DESCRIPTION = ': ';

  static describe(profile) {
    return profile.seen === 1 ? ProfileSummary._single(profile) : ProfileSummary._several(profile);
  }

  static _single(profile) {
    const value = profile.firstValue;
    const inline = profile.path === JsonPath.ROOT ? null : BoundedJson.stringify(value, ProfileSummary.INLINE_CHARS);
    if (inline !== null) return { text: ProfileSummary.VALUE + inline, detail: '', expands: false };
    if (typeof value === 'string') return ProfileSummary._singleString(value);
    if (Array.isArray(value)) return ProfileSummary._singleArray(value, profile);
    return ProfileSummary._described(`object, ${CountPhrase.of(Object.keys(value).length, 'key')}`, '', true);
  }

  static _singleString(text) {
    const preview = `, begins ${StringPreview.quote(text)}`;
    return ProfileSummary._described(`string, ${CountPhrase.of(text.length, 'char')}`, preview, false);
  }

  static _singleArray(items, profile) {
    const profiled = profile.element ? profile.element.seen : 0;
    const sampled = profiled < items.length ? `, ${profiled} sampled` : '';
    const first = BoundedJson.stringify(items[0], ProfileSummary.EXAMPLE_CHARS);
    const example = first === null ? '' : `, first = ${first}`;
    return ProfileSummary._described(`array, ${CountPhrase.of(items.length, 'item')}${sampled}`, example, true);
  }

  static _several(profile) {
    const kinds = ValueKind.ORDER.filter((kind) => profile.countOf(kind) > 0);
    const phrases = kinds.map((kind) => ProfileSummary._kindPhrase(profile, kind));
    const detail = profile.countOf('string') > 0 ? profile.stats.string.detail() : '';
    const expands = profile.countOf('object') > 0 || profile.countOf('array') > 0;
    return ProfileSummary._described(phrases.join(' | '), detail, expands);
  }

  static _kindPhrase(profile, kind) {
    if (kind === 'object') return `object, ${CountPhrase.of(profile.fieldCount, 'field')}`;
    if (kind === 'array') return `array of ${profile.arrayLengths.phrase()} ${CountPhrase.noun(profile.arrayLengths.max, 'item')}`;
    if (kind === 'null') return 'null';
    return profile.stats[kind].describe();
  }

  static _described(text, detail, expands) {
    return { text: ProfileSummary.DESCRIPTION + text, detail, expands };
  }
}

module.exports = ProfileSummary;
