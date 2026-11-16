const TrainingRecipes = require('./TrainingRecipes');

class TrainableModels {
  static CHECKPOINT = /\.(safetensors|ckpt)$/i;

  constructor({ host, recipeFor = (model) => TrainingRecipes.forModel(model) }) {
    this._host = host;
    this._recipeFor = recipeFor;
  }

  async trainable() {
    const models = await this._host.installedModels();
    return models.map((model) => ({ model, recipe: this._recipeFor(model) })).filter((pair) => pair.recipe);
  }

  async find(ref) {
    const models = await this._host.installedModels();
    const wanted = ref || this._host.defaultGenerateModelId();
    if (!wanted) throw new Error('No image model was named and none is pinned as the generation default in Image Setup.');
    const model = TrainableModels.match(models, wanted);
    if (!model) throw new Error(`No installed image model matches "${wanted}". Installed: ${models.map((m) => m.id).join(', ') || 'none'}.`);
    return model;
  }

  async trainingTarget(ref) {
    const model = await this.find(ref);
    const recipe = this._recipeFor(model);
    if (!recipe) throw new Error(`"${model.label || model.id}" cannot be trained: ${TrainingRecipes.unavailableReason(model.family)}`);
    return { model, recipe, basePath: TrainableModels.basePath(model, recipe) };
  }

  recipeOf(model) {
    return this._recipeFor(model);
  }

  static match(models, wanted) {
    const needle = String(wanted).trim().toLowerCase();
    return models.find((m) => String(m.id).toLowerCase() === needle)
      || models.find((m) => String(m.label || '').toLowerCase() === needle)
      || null;
  }

  static basePath(model, recipe) {
    if (recipe.base.kind !== 'installed-file') return recipe.base.repo;
    const file = model.files && model.files[recipe.base.role];
    if (!file || !file.path || !TrainableModels.CHECKPOINT.test(file.path)) {
      throw new Error(`"${model.label || model.id}" is not a full-precision checkpoint file, which this family's training needs.`);
    }
    return file.path;
  }
}

module.exports = TrainableModels;
