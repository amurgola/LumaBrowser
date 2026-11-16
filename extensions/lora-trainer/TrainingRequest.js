class TrainingRequest {
  static MIN_IMAGES = 4;
  static MAX_IMAGES = 200;
  static NAME_MAX = 48;
  static TRIGGER_MAX = 40;
  static SUBJECT_MAX = 160;
  static STEPS = { min: 200, max: 10000 };
  static RANK = { min: 4, max: 128 };

  static parse(args = {}) {
    const name = TrainingRequest.slug(args.name);
    if (!name) throw new Error('train_lora needs a "name" for the LoRA (letters and digits).');
    const request = {
      name,
      trigger: TrainingRequest._trigger(args.trigger, name),
      subject: TrainingRequest._text(args.subject, TrainingRequest.SUBJECT_MAX),
      artifactIds: TrainingRequest._strings(args.images),
      paths: TrainingRequest._strings(args.imagePaths),
      folder: TrainingRequest._text(args.imageFolder, 1000) || null,
      modelRef: TrainingRequest._text(args.model, 200) || null,
      steps: TrainingRequest._bounded(args.steps, TrainingRequest.STEPS),
      rank: TrainingRequest._bounded(args.rank, TrainingRequest.RANK),
      applyWhenDone: args.applyWhenDone === true,
    };
    TrainingRequest._assertHasSources(request);
    return request;
  }

  static slug(value) {
    return String(value || '').toLowerCase().trim()
      .replace(/[^a-z0-9_-]+/g, '_')
      .replace(/^[_-]+|[_-]+$/g, '')
      .slice(0, TrainingRequest.NAME_MAX);
  }

  static assertEnoughImages(count) {
    if (count < TrainingRequest.MIN_IMAGES) {
      throw new Error(`A LoRA needs at least ${TrainingRequest.MIN_IMAGES} usable pictures; ${count} were found. 10 to 30 varied pictures work best.`);
    }
  }

  static _trigger(value, name) {
    const given = String(value || '').trim().replace(/\s+/g, '_').replace(/[^\w-]+/g, '').slice(0, TrainingRequest.TRIGGER_MAX);
    return given || name.replace(/-/g, '_');
  }

  static _assertHasSources(request) {
    if (!request.artifactIds.length && !request.paths.length && !request.folder) {
      throw new Error('train_lora needs pictures: "images" (ids of pictures in this chat), "imageFolder" or "imagePaths".');
    }
  }

  static _text(value, max) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
  }

  static _strings(value) {
    return (Array.isArray(value) ? value : [])
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim());
  }

  static _bounded(value, { min, max }) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number) || number <= 0) return null;
    return Math.min(max, Math.max(min, number));
  }
}

module.exports = TrainingRequest;
