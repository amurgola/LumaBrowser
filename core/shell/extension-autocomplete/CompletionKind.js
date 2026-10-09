class CompletionKind {
  static TEXT = 1;
  static METHOD = 2;
  static FUNCTION = 3;
  static CLASS = 4;
  static VALUE = 5;
  static INTERFACE = 6;
  static PROPERTY = 7;
  static FIELD = 8;
  static VARIABLE = 11;
  static KEYWORD = 14;
  static CONSTANT = 18;
  static ENUM_MEMBER = 20;
  static FILE = 22;
  static UNIT = 25;
  static COLOR = 27;
}

module.exports = CompletionKind;
