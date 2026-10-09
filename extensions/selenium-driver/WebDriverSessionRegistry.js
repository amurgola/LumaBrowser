const crypto = require('crypto');
const WebDriverSession = require('./WebDriverSession');

class WebDriverSessionRegistry {
  constructor() {
    this.sessions = new Map();
  }

  create(params) {
    const session = new WebDriverSession({ id: crypto.randomUUID(), ...params });
    this.sessions.set(session.id, session);
    return session;
  }

  get(id) {
    return this.sessions.get(id) || null;
  }

  delete(id) {
    return this.sessions.delete(id);
  }

  all() {
    return Array.from(this.sessions.values());
  }

  size() {
    return this.sessions.size;
  }
}

module.exports = WebDriverSessionRegistry;
