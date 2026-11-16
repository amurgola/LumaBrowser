const ContextSurface = require('./ContextSurface');
const ImageTrainingRegistry = require('../../image-server/models/ImageTrainingRegistry');

class ImageTrainingSurface extends ContextSurface {
  constructor({ registry = ImageTrainingRegistry.shared } = {}) {
    super();
    this._registry = registry;
  }

  get key() {
    return 'imageTraining';
  }

  forExtension(extensionId) {
    return {
      register: (recipe) => this._registry.register(recipe, extensionId),
      unregister: (id) => this._registry.unregister(id),
      list: () => this._registry.list(),
      recipeFor: (model) => this._registry.recipeFor(model),
    };
  }
}

module.exports = ImageTrainingSurface;
