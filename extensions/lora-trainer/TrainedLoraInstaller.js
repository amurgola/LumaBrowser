const fs = require('fs');
const path = require('path');

class TrainedLoraInstaller {
  static TRAINER = 'ai-toolkit';
  static MAX_SUFFIX = 99;

  constructor({ host, paths, fsOps = fs }) {
    this._host = host;
    this._paths = paths;
    this._fs = fsOps;
  }

  availableName(wanted) {
    const taken = new Set(this._host.listLoras().map((lora) => lora.name));
    if (!taken.has(wanted)) return wanted;
    for (let n = 2; n <= TrainedLoraInstaller.MAX_SUFFIX; n += 1) {
      if (!taken.has(`${wanted}_${n}`)) return `${wanted}_${n}`;
    }
    throw new Error(`The LoRA library already holds many LoRAs named "${wanted}". Pick another name.`);
  }

  async install(job) {
    const file = this.outputFile(job);
    if (!this._fs.existsSync(file)) throw new Error(`The trainer finished without writing ${path.basename(file)}.`);
    return this._host.importLora(file, TrainedLoraInstaller.sidecarOf(job));
  }

  outputFile(job) {
    return path.join(this._paths.outputDir(job.id), job.name, `${job.name}.safetensors`);
  }

  static sidecarOf(job) {
    return {
      family: job.family,
      recipeId: job.recipeId,
      trainedFor: job.modelId,
      trigger: job.trigger,
      trainer: TrainedLoraInstaller.TRAINER,
      steps: job.steps,
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = TrainedLoraInstaller;
