const ShellWords = require('../ShellWords');
const ShellCommandName = require('../ShellCommandName');

class HostCommand {
  constructor({ name, args, dialect } = {}) {
    this.display = String(name ?? '');
    this.name = ShellCommandName.base(this.display);
    this.args = Array.isArray(args) ? args.map((arg) => String(arg ?? '')) : [];
    this.lowered = ShellWords.lowerAll(this.args);
    this.dialect = dialect;
    this.positionals = ShellWords.nonFlags(this.lowered);
    Object.freeze(this);
  }

  has(...words) {
    return this.lowered.some((arg) => words.includes(arg));
  }

  hasPrefix(...prefixes) {
    return this.lowered.some((arg) => prefixes.some((prefix) => arg.startsWith(prefix)));
  }

  hasShortFlag(letter) {
    return ShellWords.hasShortFlag(this.args, letter);
  }

  valueAfter(...flags) {
    const at = this.lowered.findIndex((arg) => flags.includes(arg));
    return at >= 0 && at + 1 < this.lowered.length ? this.lowered[at + 1] : null;
  }

  positionalsSkipping(valueFlags) {
    const out = [];
    for (let i = 0; i < this.args.length; i++) {
      if (valueFlags.includes(this.args[i])) i++;
      else if (!this.lowered[i].startsWith('-')) out.push(this.lowered[i]);
    }
    return out;
  }
}

module.exports = HostCommand;
