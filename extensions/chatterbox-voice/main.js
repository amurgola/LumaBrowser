'use strict';

const ChatterboxExtension = require('./ChatterboxExtension');

const extension = new ChatterboxExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),

  _internals: {
    handleInvoke: (action, payload) => extension.handleInvoke(action, payload),
    status: () => extension.status(),
    modelsDir: () => extension.modelsDir(),
    runtimesDir: () => extension.runtimesDir(),
  },
};
