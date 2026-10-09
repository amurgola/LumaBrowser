const ShellWords = require('../../ShellWords');

class GitOptionScan {
  static FULL_NAMES_THAT_PREFIX_OTHERS = new Set(['--text', '--filter', '--force', '--output', '--delete', '--prune']);

  static MIN_ABBREVIATION = 3;

  static optionWords(words) {
    const end = words.indexOf('--');
    return end === -1 ? words : words.slice(0, end);
  }

  static hasLong(words, ...longNames) {
    return GitOptionScan.optionWords(words).some((word) => longNames.some((name) => GitOptionScan.names(word, name)));
  }

  static hasShort(words, letter) {
    return ShellWords.hasShortFlag(GitOptionScan.optionWords(words), letter);
  }

  static has(words, { long = [], short = [], values = [] }) {
    const options = GitOptionScan.withoutValues(words, values);
    return GitOptionScan.hasLong(options, ...long) || short.some((letter) => GitOptionScan.hasShort(options, letter));
  }

  static withoutValues(words, valueOptions) {
    const kept = [];
    for (let i = 0; i < words.length; i++) {
      kept.push(words[i]);
      if (valueOptions.includes(words[i])) i++;
    }
    return kept;
  }

  static names(word, longName) {
    if (!word.startsWith('--') || word === '--') return false;
    const key = GitOptionScan.keyOf(word);
    if (key === longName) return true;
    return GitOptionScan._isAbbreviation(key, longName);
  }

  static keyOf(word) {
    const eq = word.indexOf('=');
    return eq === -1 ? word : word.slice(0, eq);
  }

  static walk(words, spec) {
    const result = { known: true, positionals: [], seen: new Set() };
    for (let i = 0; i < words.length; i++) {
      if (words[i] === '--') { result.positionals.push(...words.slice(i + 1)); break; }
      i += GitOptionScan._readWord(words, i, spec, result);
    }
    return result;
  }

  static _readWord(words, i, spec, result) {
    const word = words[i];
    if (!word.startsWith('-') || word === '-') { result.positionals.push(word); return 0; }
    if (word.startsWith('--')) return GitOptionScan._readLong(words, i, spec, result);
    return GitOptionScan._readShortBundle(words, i, spec, result);
  }

  static _readLong(words, i, spec, result) {
    const key = GitOptionScan.keyOf(words[i]);
    const hasAttached = words[i].includes('=');
    result.seen.add(key);
    if (GitOptionScan._in(spec.switches, key)) return GitOptionScan._rejectValue(hasAttached, result);
    if (GitOptionScan._in(spec.attached, key)) return 0;
    if (GitOptionScan._in(spec.values, key)) return hasAttached ? 0 : 1;
    if (GitOptionScan._in(spec.lastArgDefault, key)) return hasAttached || i + 1 >= words.length ? 0 : 1;
    result.known = false;
    return 0;
  }

  static _readShortBundle(words, i, spec, result) {
    const letters = words[i].slice(1);
    for (let at = 0; at < letters.length; at++) {
      const option = `-${letters[at]}`;
      result.seen.add(option);
      const glued = at + 1 < letters.length;
      if (GitOptionScan._in(spec.switches, option)) continue;
      if (GitOptionScan._in(spec.attached, option)) return 0;
      if (GitOptionScan._in(spec.values, option)) return glued ? 0 : 1;
      if (GitOptionScan._in(spec.lastArgDefault, option)) return glued || i + 1 >= words.length ? 0 : 1;
      result.known = false;
      return 0;
    }
    return 0;
  }

  static _rejectValue(hasAttached, result) {
    if (hasAttached) result.known = false;
    return 0;
  }

  static _in(list, option) {
    return Boolean(list) && list.includes(option);
  }

  static _isAbbreviation(key, longName) {
    if (GitOptionScan.FULL_NAMES_THAT_PREFIX_OTHERS.has(key)) return false;
    if (key.length - 2 < GitOptionScan.MIN_ABBREVIATION) return false;
    return longName.startsWith(key);
  }
}

module.exports = GitOptionScan;
