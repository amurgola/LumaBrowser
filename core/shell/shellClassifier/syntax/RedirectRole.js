class RedirectRole {
  static OUTPUT = 'output';
  static INPUT = 'input';
  static DUPLICATION = 'duplication';

  static DUPLICATED_FD = /^(\d+|-)$/;

  static of(op, target) {
    const operator = op.replace(/^[\d*]+/, '');
    if (operator.endsWith('&') && RedirectRole.DUPLICATED_FD.test(target)) return RedirectRole.DUPLICATION;
    if (operator.startsWith('<') && operator !== '<>') return RedirectRole.INPUT;
    return RedirectRole.OUTPUT;
  }
}

module.exports = RedirectRole;
