const PermissionManager = require('../browser/PermissionManager');
const PermissionKinds = require('../browser/PermissionKinds');

class PromptApiAccess {
  constructor({ getPermissions = () => PermissionManager.current(), pageById = null } = {}) {
    this._getPermissions = getPermissions;
    this._pageById = pageById || ((id) => require('electron').webContents.fromId(id));
  }

  blocked(origin) {
    const permissions = this._getPermissions();
    return !!permissions && permissions.siteBlocked(origin, PermissionKinds.LOCAL_MODEL);
  }

  async allowed({ webContentsId, origin }) {
    const permissions = this._getPermissions();
    const page = this._page(webContentsId);
    if (!permissions || !page) return false;
    return permissions.decideSiteAccess(page, origin, PermissionKinds.LOCAL_MODEL);
  }

  _page(webContentsId) {
    try {
      const page = this._pageById(webContentsId);
      return page && !(typeof page.isDestroyed === 'function' && page.isDestroyed()) ? page : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = PromptApiAccess;
