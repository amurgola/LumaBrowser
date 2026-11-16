const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class ImageTrainingRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'imageTraining.register';

  static shared = new ImageTrainingRegistry();

  recipeFor(model) {
    return this.list().find((recipe) => ImageTrainingRegistry.matches(recipe, model)) || null;
  }

  static matches(recipe, model) {
    if (!recipe || !model || !model.id) return false;
    if (Array.isArray(recipe.modelIds) && recipe.modelIds.length) return recipe.modelIds.includes(model.id);
    if (Array.isArray(recipe.excludeModelIds) && recipe.excludeModelIds.includes(model.id)) return false;
    return Array.isArray(recipe.families) && !!model.family && recipe.families.includes(model.family);
  }

  _validate(recipe) {
    const families = Array.isArray(recipe.families) ? recipe.families : [];
    const modelIds = Array.isArray(recipe.modelIds) ? recipe.modelIds : [];
    if (!families.length && !modelIds.length) {
      throw new Error(`${ImageTrainingRegistry.ERROR_PREFIX}: recipe.families or recipe.modelIds is required`);
    }
  }
}

module.exports = ImageTrainingRegistry;
