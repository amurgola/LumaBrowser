const PermissionManager = require('../PermissionManager');

class TabPermissionHook {
  static install(entry) {
    const manager = PermissionManager.current();
    if (manager) manager.attachSession(entry.webContents.session);
    else TabPermissionHook._installFallback(entry);
  }

  static _installFallback(entry) {
    entry.webContents.session.setPermissionRequestHandler((requestingContents, permission, callback) => {
      const granted = permission === 'notifications';
      const url = (requestingContents && requestingContents.getURL()) || entry.url;
      console.log(`[tab ${entry.id}] permission ${granted ? 'granted' : 'denied'}: ${permission} (${url})`);
      callback(granted);
    });
  }
}

module.exports = TabPermissionHook;
