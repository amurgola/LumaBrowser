const ShellWords = require('./ShellWords');

class PowerShellArgs {
  static MIN_ABBREVIATION = 3;

  static VALUE_PARAMS = Object.freeze([
    'path', 'literalpath', 'destination', 'filepath', 'destinationpath', 'outfile', 'name', 'include', 'exclude',
    'filter', 'erroraction', 'encoding', 'value', 'itemtype', 'newname', 'uri', 'method', 'body', 'headers', 'depth',
  ]);

  static FALSE_VALUES = Object.freeze(['$false', 'false', '0']);

  static param(args, names) {
    const wanted = names.map(ShellWords.lower);
    for (let i = 0; i < args.length; i++) {
      const parsed = PowerShellArgs._parseParameter(args[i]);
      if (!parsed || !PowerShellArgs._matchesAny(parsed.key, wanted)) continue;
      if (parsed.inlineValue != null) return parsed.inlineValue;
      return PowerShellArgs._followingValue(args[i + 1]);
    }
    return null;
  }

  static switchOn(args, name) {
    const value = PowerShellArgs.param(args, [name]);
    return value !== null && !PowerShellArgs.FALSE_VALUES.includes(value);
  }

  static positionals(args) {
    const out = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (!arg.startsWith('-')) { out.push(arg); continue; }
      if (PowerShellArgs._takesFollowingValue(arg)) i++;
    }
    return out;
  }

  static splitList(value) {
    return String(value).split(',').map((part) => part.trim()).filter(Boolean);
  }

  static _parseParameter(arg) {
    const lowered = ShellWords.lower(arg);
    if (!lowered.startsWith('-')) return null;
    const colon = lowered.indexOf(':');
    if (colon === -1) return { key: lowered.slice(1), inlineValue: null };
    return { key: lowered.slice(1, colon), inlineValue: arg.slice(colon + 1) };
  }

  static _matchesAny(key, wanted) {
    return wanted.some((name) => PowerShellArgs._abbreviates(key, name));
  }

  static _abbreviates(key, name) {
    return name === key || (key.length >= PowerShellArgs.MIN_ABBREVIATION && name.startsWith(key));
  }

  static _followingValue(next) {
    return next != null && !next.startsWith('-') ? next : true;
  }

  static _takesFollowingValue(arg) {
    if (arg.includes(':')) return false;
    const key = ShellWords.lower(arg.replace(/^-/, '').split(':')[0]);
    return PowerShellArgs.VALUE_PARAMS.some((name) => PowerShellArgs._abbreviates(key, name));
  }
}

module.exports = PowerShellArgs;
