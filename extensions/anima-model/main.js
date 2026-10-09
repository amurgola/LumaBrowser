const AnimaCatalogEntries = require('./AnimaCatalogEntries');

module.exports = {
  async activate(context) {
    AnimaCatalogEntries.registerInto(context && context.imageCatalog);
    return {};
  },

  async deactivate() {},
};
