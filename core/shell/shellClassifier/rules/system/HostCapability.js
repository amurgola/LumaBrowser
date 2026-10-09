const ShellRule = require('../../ShellRule');

class HostCapability {
  covers(command) {
    throw new Error(`${this.constructor.name} must implement covers(command)`);
  }

  judge(command) {
    throw new Error(`${this.constructor.name} must implement judge(command)`);
  }

  static forbid(reason) {
    return ShellRule.forbidden(reason);
  }

  static ask(reason) {
    return ShellRule.massDestructive(reason);
  }
}

module.exports = HostCapability;
