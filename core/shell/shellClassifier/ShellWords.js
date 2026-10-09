class ShellWords {
  static lower(value) {
    return String(value || '').toLowerCase();
  }

  static lowerAll(args) {
    return args.map(ShellWords.lower);
  }

  static hasShortFlag(args, letter) {
    return args.some((arg) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter));
  }

  static nonFlags(args) {
    return args.filter((arg) => !arg.startsWith('-'));
  }

  static splitWords(text) {
    return String(text).trim().split(/\s+/).filter(Boolean);
  }
}

module.exports = ShellWords;
