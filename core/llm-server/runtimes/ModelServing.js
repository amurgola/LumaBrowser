const RuntimeFrameworks = require('./RuntimeFrameworks');

class ModelServing {
  static attach(models, { chooser, selection, context }) {
    for (const model of models || []) model.servedBy = ModelServing.of(model, { chooser, selection, context });
    return models;
  }

  static of(model, { chooser, selection, context }) {
    const outcome = chooser.forModel(model, context);
    const row = outcome.runtime || outcome.missing || null;
    return {
      format: RuntimeFrameworks.formatOfModel(model),
      frameworkId: outcome.frameworkId || null,
      runtimeId: row ? row.id : null,
      why: outcome.why || null,
      installed: !!outcome.runtime,
      pinnedFrameworkId: selection.modelFramework(ModelServing._pathOf(model)),
    };
  }

  static _pathOf(model) {
    const weights = model && Array.isArray(model.weights) ? model.weights[0] : null;
    return (weights && weights.path) || null;
  }
}

module.exports = ModelServing;
