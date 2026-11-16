class TrainerOverview {
  constructor({ jobs, models, runtime, host }) {
    this._jobs = jobs;
    this._models = models;
    this._runtime = runtime;
    this._host = host;
  }

  async describe(jobId = null) {
    const recent = this._jobs.recent();
    const job = jobId ? this._jobs.get(jobId) : (this._jobs.active() || recent[0] || null);
    return {
      job: job ? job.snapshot() : null,
      recentJobs: recent.map((entry) => TrainerOverview._jobLine(entry)),
      trainerInstalled: this._runtime.status().installed,
      trainableModels: await this._trainableModels(),
      trainedLoras: this._trainedLoras(),
    };
  }

  async _trainableModels() {
    try {
      return (await this._models.trainable()).map(({ model, recipe }) => ({
        id: model.id,
        label: model.label || model.id,
        family: model.family,
        recipe: recipe.label,
        usualSteps: recipe.steps,
        needsVramGb: recipe.minVramGb,
        firstRunDownloadGb: recipe.base.kind === 'hub' ? recipe.base.approxGb : 0,
        note: recipe.note,
      }));
    } catch (_) {
      return [];
    }
  }

  _trainedLoras() {
    try {
      return this._host.listLoras().filter((lora) => lora.trained).map((lora) => ({
        name: lora.name,
        family: lora.trained.family || null,
        trainedFor: lora.trained.trainedFor || null,
        trigger: lora.trained.trigger || null,
      }));
    } catch (_) {
      return [];
    }
  }

  static _jobLine(job) {
    return { id: job.id, name: job.name, model: job.modelId, phase: job.phase, lora: job.lora, createdAt: job.createdAt };
  }
}

module.exports = TrainerOverview;
