'use strict';

const ModelTestingExtension = require('./ModelTestingExtension');

const extension = new ModelTestingExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),

  _internals: {
    handleInvoke: (action, payload) => extension.handleInvoke(action, payload),
  },
};
