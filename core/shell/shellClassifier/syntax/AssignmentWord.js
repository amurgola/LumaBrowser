class AssignmentWord {
  static UNQUOTED_PREFIX = /^([A-Za-z_][A-Za-z0-9_]*)\+?=/;

  static parse(word) {
    const prefix = AssignmentWord.UNQUOTED_PREFIX.exec(word.raw);
    if (!prefix) return null;
    return { name: prefix[1], value: word.text.slice(prefix[0].length) };
  }
}

module.exports = AssignmentWord;
