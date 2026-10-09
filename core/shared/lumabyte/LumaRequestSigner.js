const crypto = require('crypto');

class LumaRequestSigner {
  static CLIENT_SECRET = 'lb_tpl_v1_6t7K2pZqN3wX8fJrD5eH9cYmU4sA1bVn';

  static TOKEN_WINDOW_SECONDS = 30;

  static computeToken(machineId) {
    if (!machineId) return null;
    const payload = `v1.${machineId}.${LumaRequestSigner._currentWindow()}`;
    return crypto.createHmac('sha256', LumaRequestSigner.CLIENT_SECRET).update(payload).digest('hex');
  }

  static buildAuthHeaders(identity) {
    return LumaRequestSigner._machineHeaders(identity?.machineId);
  }

  static _currentWindow() {
    return Math.floor(Date.now() / 1000 / LumaRequestSigner.TOKEN_WINDOW_SECONDS);
  }

  static _machineHeaders(machineId) {
    if (!machineId) return {};
    const headers = { 'X-Machine-Id': machineId };
    const token = LumaRequestSigner.computeToken(machineId);
    if (token) headers['X-Luma-Token'] = token;
    return headers;
  }
}

module.exports = LumaRequestSigner;
