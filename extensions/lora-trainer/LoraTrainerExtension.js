const AppPaths = require('../../core/shared/AppPaths');
const ImageCaptioner = require('./ImageCaptioner');
const LoraApplier = require('./LoraApplier');
const LoraTrainingFlow = require('./LoraTrainingFlow');
const ProcessRunner = require('./ProcessRunner');
const TrainableModels = require('./TrainableModels');
const TrainedLoraInstaller = require('./TrainedLoraInstaller');
const TrainerEnvironment = require('./TrainerEnvironment');
const TrainerImageHost = require('./TrainerImageHost');
const TrainerOverview = require('./TrainerOverview');
const TrainerPaths = require('./TrainerPaths');
const TrainerRuntime = require('./TrainerRuntime');
const TrainingAnnouncer = require('./TrainingAnnouncer');
const TrainingDataset = require('./TrainingDataset');
const TrainingGpu = require('./TrainingGpu');
const TrainingImageSources = require('./TrainingImageSources');
const TrainingJobs = require('./TrainingJobs');
const TrainingRecipes = require('./TrainingRecipes');
const TrainingWorkspace = require('./TrainingWorkspace');
const mcpTools = require('./mcp-tools');

class LoraTrainerExtension {
  constructor({ baseDir = () => AppPaths.appBaseDir(), tools = mcpTools } = {}) {
    this._baseDir = baseDir;
    this._tools = tools;
    this._services = null;
  }

  async activate(context) {
    this._registerRecipes(context.imageTraining);
    this._services = this._buildServices(context);
    this._tools.bind(this._services);
    LoraTrainerExtension._log(context, 'LoRA Trainer activated');
    return { status: (jobId) => this._services.overview.describe(jobId), recipes: () => TrainingRecipes.all() };
  }

  async deactivate() {
    this._tools.bind(null);
    if (this._services) this._services.flow.cancel();
    this._services = null;
  }

  _registerRecipes(imageTraining) {
    if (!imageTraining || typeof imageTraining.register !== 'function') return;
    for (const recipe of TrainingRecipes.all()) imageTraining.register(TrainingRecipes.registryEntry(recipe));
  }

  _buildServices(context) {
    const paths = new TrainerPaths({ baseDir: this._baseDir() });
    const host = new TrainerImageHost();
    const runner = new ProcessRunner();
    const runtime = new TrainerRuntime({ paths, environment: new TrainerEnvironment({ paths }), runner });
    const models = new TrainableModels({ host });
    const jobs = new TrainingJobs({ paths });
    const workspace = new TrainingWorkspace({ paths });
    workspace.clearAbandoned(jobs.abandonedIds());
    const applier = new LoraApplier({ host, models });
    let flow = null;
    const announcer = new TrainingAnnouncer({ cancel: (jobId) => flow.cancel(jobId), logPathOf: (jobId) => paths.logPath(jobId) });
    flow = new LoraTrainingFlow({
      jobs, models, runtime, runner, applier, workspace, host, paths, announcer,
      sources: new TrainingImageSources({ host }),
      dataset: new TrainingDataset({ captioner: new ImageCaptioner({ chat: context.chat }) }),
      gpu: new TrainingGpu(),
      installer: new TrainedLoraInstaller({ host, paths }),
      log: (message) => LoraTrainerExtension._log(context, message),
    });
    return { flow, applier, overview: new TrainerOverview({ jobs, models, runtime, host }) };
  }

  static _log(context, message) {
    try { if (context && context.logger && context.logger.info) context.logger.info(message); } catch (_) {}
  }
}

module.exports = LoraTrainerExtension;
