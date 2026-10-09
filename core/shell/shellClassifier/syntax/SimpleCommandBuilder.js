const ShellToken = require('./ShellToken');
const AssignmentWord = require('./AssignmentWord');
const RedirectRole = require('./RedirectRole');

class SimpleCommandBuilder {
  constructor(syntax) {
    this._syntax = syntax;
  }

  build(tokens, joinedBy) {
    const command = SimpleCommandBuilder._emptyCommand(tokens, joinedBy);
    for (let i = 0; i < tokens.length; i++) {
      if (ShellToken.is(tokens[i], ShellToken.REDIRECT)) i += this._attachRedirect(command, tokens[i], tokens[i + 1]);
      else this._addWord(command, tokens[i]);
    }
    return command;
  }

  static _emptyCommand(tokens, joinedBy) {
    const span = { start: tokens[0].span.start, end: tokens[tokens.length - 1].span.end };
    return { assignments: [], name: null, args: [], redirects: [], inputs: [], joinedBy, background: false, span };
  }

  _attachRedirect(command, redirect, target) {
    if (!ShellToken.is(target, ShellToken.WORD)) return 0;
    const role = RedirectRole.of(redirect.op, target.text);
    const entry = { op: redirect.op, target: target.text, fd: redirect.fd };
    if (role === RedirectRole.OUTPUT) command.redirects.push(entry);
    else if (role === RedirectRole.INPUT) command.inputs.push(entry);
    return 1;
  }

  _addWord(command, word) {
    if (command.name !== null) {
      command.args.push(word.text);
      return;
    }
    const assignment = this._syntax.assignments ? AssignmentWord.parse(word) : null;
    if (assignment) command.assignments.push(assignment);
    else command.name = word.text;
  }
}

module.exports = SimpleCommandBuilder;
