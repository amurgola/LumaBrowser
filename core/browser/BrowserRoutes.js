const express = require('express');
const BrowserActions = require('./BrowserActions');

class BrowserRoutes {
  static create(browserController) {
    const router = express.Router();
    for (const route of BrowserActions.restRoutes()) {
      BrowserRoutes._requireHandler(browserController, route);
      router[route.method](route.path, (req, res) => browserController[route.handler](req, res));
    }
    return router;
  }

  static _requireHandler(browserController, { method, path, handler }) {
    if (typeof browserController[handler] === 'function') return;
    throw new Error(`browserActions: BrowserController has no handler "${handler}" for ${method.toUpperCase()} ${path}`);
  }
}

module.exports = BrowserRoutes;
