class HostTerminal {
  static ENV = 'LUMA_TERMINAL';
  static ID = /^t\d+$/;

  static id(env = process.env) {
    const value = env && env[HostTerminal.ENV] ? String(env[HostTerminal.ENV]).trim() : '';
    return HostTerminal.ID.test(value) ? value : null;
  }
}

module.exports = HostTerminal;
