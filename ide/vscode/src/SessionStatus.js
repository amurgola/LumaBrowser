'use strict';

class SessionStatus {
  static OFFLINE = 'offline';
  static STARTING = 'starting';
  static CONNECTING = 'connecting';
  static READY = 'ready';
  static ERROR = 'error';
}

module.exports = SessionStatus;
