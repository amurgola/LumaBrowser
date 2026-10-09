const os = require('os');

class ShellPathExpander {
  static expand(word, env) {
    let text = String(word || '');
    text = text.replace(/\$env:([A-Za-z_][A-Za-z0-9_]*)/gi, (_, key) => ShellPathExpander.lookup(env, key) ?? `$env:${key}`);
    text = text.replace(/%([A-Za-z_][A-Za-z0-9_()]*)%/g, (_, key) => ShellPathExpander.lookup(env, key) ?? `%${key}%`);
    text = text.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, braced, bare) => ShellPathExpander._posixVariable(env, braced || bare, match));
    return ShellPathExpander._expandHome(text, env);
  }

  static lookup(env, key) {
    if (!env) return undefined;
    if (key in env) return env[key];
    const match = Object.keys(env).find((name) => name.toLowerCase() === key.toLowerCase());
    return match ? env[match] : undefined;
  }

  static homeOf(env) {
    return ShellPathExpander.lookup(env, 'HOME') || ShellPathExpander.lookup(env, 'USERPROFILE');
  }

  static hasUnresolvedVariable(text) {
    return /\$env:|%[A-Za-z_][A-Za-z0-9_()]*%|\$\{?[A-Za-z_]/.test(text);
  }

  static unquote(word) {
    const text = String(word || '').trim();
    const doubleQuoted = text.startsWith('"') && text.endsWith('"');
    const singleQuoted = text.startsWith("'") && text.endsWith("'");
    return doubleQuoted || singleQuoted ? text.slice(1, -1) : text;
  }

  static _posixVariable(env, key, original) {
    if (key === 'PWD' || key === 'pwd') return '.';
    const value = ShellPathExpander.lookup(env, key);
    return value == null ? original : value;
  }

  static _expandHome(text, env) {
    if (text !== '~' && !text.startsWith('~/') && !text.startsWith('~\\')) return text;
    return (ShellPathExpander.homeOf(env) || os.homedir()) + text.slice(1);
  }
}

module.exports = ShellPathExpander;
