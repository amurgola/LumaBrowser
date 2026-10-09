class UnhandledRejectionTap {
  static IGNORED = 'Script failed to execute';

  static install(proc = process, log = console) {
    proc.on('unhandledRejection', (reason) => UnhandledRejectionTap.handle(reason, log));
  }

  static handle(reason, log = console) {
    const message = UnhandledRejectionTap.messageOf(reason);
    if (message.includes(UnhandledRejectionTap.IGNORED)) return false;
    log.error('[main] unhandled rejection:', (reason && reason.stack) || message);
    return true;
  }

  static messageOf(reason) {
    return String((reason && reason.message) || reason || '');
  }
}

module.exports = UnhandledRejectionTap;
