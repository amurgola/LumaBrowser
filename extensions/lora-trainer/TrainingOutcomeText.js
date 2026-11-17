class TrainingOutcomeText {
  static ERROR_MAX = 300;

  static of(job, { logPath = null } = {}) {
    if (job.lora) return TrainingOutcomeText._done(job);
    if (job.error) return TrainingOutcomeText._failed(job, logPath);
    return `Training the LoRA "${job.name}" was stopped before it finished. Nothing was added to the LoRA library.`;
  }

  static _done(job) {
    const model = job.modelLabel || job.modelId;
    const pictures = job.images && job.images.count ? ` on ${job.images.count} pictures` : '';
    const took = TrainingOutcomeText.duration(job.createdAt, job.finishedAt);
    const facts = `${job.steps} steps${pictures}${took ? `, ${took}` : ''}`;
    const next = job.applied
      ? `It is attached to ${model} now: put "${job.trigger}" in an image prompt to use it.`
      : `Ask me to apply it to ${model} when you want to use it; image prompts then need the word "${job.trigger}".`;
    return `The LoRA "${job.lora}" has finished training for ${model} (${facts}). `
      + `It is in the LoRA library and its trigger word is "${job.trigger}". ${next}`;
  }

  static _failed(job, logPath) {
    const reason = String(job.error).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).pop() || 'unknown error';
    const log = logPath ? ` The trainer log is kept at ${logPath}.` : '';
    const card = job.warning ? ` Note: ${job.warning}` : '';
    return `Training the LoRA "${job.name}" for ${job.modelLabel || job.modelId} failed: ${reason.slice(0, TrainingOutcomeText.ERROR_MAX)}${log}${card}`;
  }

  static duration(startedAt, finishedAt) {
    const ms = Date.parse(finishedAt) - Date.parse(startedAt);
    if (!Number.isFinite(ms) || ms <= 0) return '';
    const minutes = Math.max(1, Math.round(ms / 60000));
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  }
}

module.exports = TrainingOutcomeText;
