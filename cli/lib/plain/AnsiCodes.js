class AnsiCodes {
  static reset = '\x1b[0m';
  static dim = '\x1b[2m';
  static bold = '\x1b[1m';
  static red = '\x1b[31m';
  static green = '\x1b[32m';
  static yellow = '\x1b[33m';
  static cyan = '\x1b[36m';
  static magenta = '\x1b[35m';
}

module.exports = AnsiCodes;
