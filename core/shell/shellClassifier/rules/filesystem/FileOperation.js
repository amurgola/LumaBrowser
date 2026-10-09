const ShellRule = require('../../ShellRule');
const SystemPaths = require('../../SystemPaths');

class FileOperation {
  static ALL_KINDS = Object.freeze([SystemPaths.ROOT, SystemPaths.HOME, SystemPaths.SYSTEM]);

  constructor({ verb, protectedKinds = FileOperation.ALL_KINDS }) {
    this.verb = verb;
    this.protectedKinds = protectedKinds;
  }

  covers(command) {
    throw new Error(`${this.constructor.name} must implement covers(command)`);
  }

  targets(command) {
    throw new Error(`${this.constructor.name} must implement targets(command)`);
  }

  sweepReason(command) {
    throw new Error(`${this.constructor.name} must implement sweepReason(command)`);
  }

  reachesTargets(command) {
    return true;
  }

  unconditionalReason(command) {
    return null;
  }

  judge(command) {
    return ShellRule.forbidden(this._hostReason(command)) || ShellRule.massDestructive(this.sweepReason(command));
  }

  static hasWildcard(targets) {
    return targets.some((target) => target.includes('*'));
  }

  _hostReason(command) {
    const unconditional = this.unconditionalReason(command);
    if (unconditional) return unconditional;
    if (!this.reachesTargets(command)) return null;
    const finding = this._protectedTarget(command);
    return finding ? `${command.display} would ${this.verb} a root or system directory: ${finding.reason}.` : null;
  }

  _protectedTarget(command) {
    for (const target of this.targets(command)) {
      const finding = SystemPaths.classify(target);
      if (finding && this.protectedKinds.includes(finding.kind)) return finding;
    }
    return null;
  }
}

module.exports = FileOperation;
