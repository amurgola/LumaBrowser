class CommandProfile {
  constructor(names) {
    if (!names || names.length === 0) throw new Error(`${this.constructor.name} needs at least one command name`);
    this.names = Object.freeze([...names]);
  }

  judge(name, args) {
    throw new Error(`${this.constructor.name} must implement judge(name, args)`);
  }
}

module.exports = CommandProfile;
