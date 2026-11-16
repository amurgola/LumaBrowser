const fs = require('fs');
const TrainingConfig = require('./TrainingConfig');
const TrainingJob = require('./TrainingJob');
const TrainingProgress = require('./TrainingProgress');
const TrainingRequest = require('./TrainingRequest');

class LoraTrainingFlow {
  static CANCELED = 'CANCELED';
  static SAVE_EVERY_STEPS = 25;

  constructor({ jobs, models, sources, dataset, runtime, gpu, runner, installer, applier, workspace, host, paths, log = () => {}, fsOps = fs }) {
    this._jobs = jobs;
    this._models = models;
    this._sources = sources;
    this._dataset = dataset;
    this._runtime = runtime;
    this._gpu = gpu;
    this._runner = runner;
    this._installer = installer;
    this._applier = applier;
    this._workspace = workspace;
    this._host = host;
    this._paths = paths;
    this._log = log;
    this._fs = fsOps;
    this._running = null;
  }

  async start(args) {
    const request = TrainingRequest.parse(args);
    const target = await this._models.trainingTarget(request.modelRef);
    request.name = this._installer.availableName(request.name);
    const job = this._jobs.create({ request, model: target.model, recipe: target.recipe });
    this._running = this._run(job, request, target);
    return job.snapshot();
  }

  cancel(jobId = null) {
    const job = jobId ? this._jobs.get(jobId) : this._jobs.active();
    if (!job || !job.active) return job ? job.snapshot() : null;
    job.requestCancel();
    return job.snapshot();
  }

  async settled() {
    await this._running;
  }

  async _run(job, request, { model, recipe, basePath }) {
    try {
      const images = this._collectPictures(job, request);
      await this._writeDataset(job, images, recipe);
      await this._ensureTrainer(job);
      await this._train(job, recipe, basePath);
      const lora = await this._addToLibrary(job);
      const applied = await this._applyIfAsked(job, lora);
      job.finish({ lora: lora.name, applied });
      this._log(`LoRA "${lora.name}" trained for ${model.id}`);
    } catch (err) {
      this._conclude(job, err);
    } finally {
      this._gpu.release();
      this._workspace.clear(job.id, { succeeded: job.phase === TrainingJob.DONE });
      this._jobs.save(job);
    }
  }

  _collectPictures(job, request) {
    this._enter(job, TrainingJob.COLLECTING);
    const { images, skipped } = this._sources.collect(request, TrainingRequest.MAX_IMAGES);
    job.images = { count: images.length, skipped };
    TrainingRequest.assertEnoughImages(images.length);
    return images;
  }

  async _writeDataset(job, images, recipe) {
    this._enter(job, TrainingJob.CAPTIONING, `0 of ${images.length}`);
    const built = await this._dataset.build({
      dir: this._paths.datasetDir(job.id),
      images,
      recipe,
      trigger: job.trigger,
      subject: job.subject,
      isCanceled: () => job.cancelRequested,
      onProgress: (done, total) => job.note(`${done} of ${total}`),
    });
    job.images.described = built.described;
  }

  async _ensureTrainer(job) {
    if (this._runtime.status().installed) return;
    this._enter(job, TrainingJob.INSTALLING);
    await this._runtime.ensureInstalled({
      isCanceled: () => job.cancelRequested,
      onStep: (label, detail) => job.note(label || detail),
    });
  }

  async _train(job, recipe, basePath) {
    this._throwIfCanceled(job);
    await this._host.stopImageServers();
    const card = await this._gpu.claim(recipe);
    job.warning = card.warning;
    this._enter(job, TrainingJob.TRAINING, `Starting on ${card.name}`);
    const configPath = this._writeConfig(job, recipe, basePath);
    const progress = new TrainingProgress(job.name);
    const result = await this._runner.run({
      ...this._runtime.trainCommand({ configPath, logPath: this._paths.logPath(job.id), cudaDevice: card.cudaDevice }),
      isCanceled: () => job.cancelRequested,
      onLine: (line) => this._onTrainerLine(job, progress.read(line)),
    });
    if (result.canceled) throw LoraTrainingFlow._canceled();
    if (!result.ok) throw new Error(`The trainer stopped with an error. Last output:\n${result.tail || `exit code ${result.code}`}`);
  }

  _writeConfig(job, recipe, basePath) {
    const config = TrainingConfig.build({
      recipe,
      job,
      basePath,
      datasetDir: this._paths.datasetDir(job.id),
      outputDir: this._paths.outputDir(job.id),
    });
    const configPath = this._paths.configPath(job.id);
    this._fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }

  _onTrainerLine(job, reading) {
    if (!reading) return;
    if (reading.detail) {
      job.note(reading.detail);
      return;
    }
    job.advance(reading);
    if (reading.step % LoraTrainingFlow.SAVE_EVERY_STEPS === 0) this._jobs.save(job);
  }

  async _addToLibrary(job) {
    this._enter(job, TrainingJob.IMPORTING);
    return this._installer.install(job);
  }

  async _applyIfAsked(job, lora) {
    if (!job.applyWhenDone) return false;
    try {
      await this._applier.apply({ loraName: lora.name, modelRef: job.modelId });
      return true;
    } catch (err) {
      job.note(`Trained, but attaching it failed: ${err.message}`);
      return false;
    }
  }

  _conclude(job, err) {
    if (job.cancelRequested || (err && err.code === LoraTrainingFlow.CANCELED)) {
      job.cancel();
      this._log(`LoRA training "${job.name}" canceled`);
      return;
    }
    job.fail(err && err.message);
    this._log(`LoRA training "${job.name}" failed: ${job.error}`);
  }

  _enter(job, phase, detail = '') {
    this._throwIfCanceled(job);
    job.enter(phase, detail);
    this._jobs.save(job);
  }

  _throwIfCanceled(job) {
    if (job.cancelRequested) throw LoraTrainingFlow._canceled();
  }

  static _canceled() {
    const err = new Error('Training was canceled.');
    err.code = LoraTrainingFlow.CANCELED;
    return err;
  }
}

module.exports = LoraTrainingFlow;
