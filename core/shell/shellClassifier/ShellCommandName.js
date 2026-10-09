class ShellCommandName {
  static EXECUTABLE_EXTENSION = /\.(exe|cmd|bat|com)$/i;

  static base(command) {
    const unquoted = ShellCommandName._unquote(String(command || ''));
    const file = ShellCommandName._lastPathSegment(unquoted);
    return file.replace(ShellCommandName.EXECUTABLE_EXTENSION, '').toLowerCase();
  }

  static _unquote(text) {
    const doubleQuoted = text.startsWith('"') && text.endsWith('"');
    const singleQuoted = text.startsWith("'") && text.endsWith("'");
    return doubleQuoted || singleQuoted ? text.slice(1, -1) : text;
  }

  static _lastPathSegment(text) {
    const slash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
    return slash === -1 ? text : text.slice(slash + 1);
  }
}

module.exports = ShellCommandName;
