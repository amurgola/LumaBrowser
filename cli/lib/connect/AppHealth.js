const http = require('http');

class AppHealth {
  static TIMEOUT_MS = 2000;

  static check(port) {
    return new Promise((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/health', timeout: AppHealth.TIMEOUT_MS }, (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });
  }
}

module.exports = AppHealth;
