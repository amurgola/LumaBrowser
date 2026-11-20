const CivitaiBaseMap = require('./CivitaiBaseMap');
const CivitaiClient = require('./CivitaiClient');
const CivitaiLoraBaseMap = require('./CivitaiLoraBaseMap');
const CivitaiModelResolver = require('./CivitaiModelResolver');

class CivitaiLoraResolver {
  static SOURCE = 'civitai';

  static FILE_EXT = /\.safetensors$/i;

  static UNSAFE_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

  static DORA_UNSUPPORTED = 'This is a DoRA: the sd.cpp runtime does not apply DoRA weight scaling yet, so it cannot be used.';

  static NOT_A_LORA = (type) => `This CivitAI model is a ${type || 'non-LoRA asset'}, not a LoRA. `
    + (type === 'Checkpoint' ? 'Install checkpoints from Browse CivitAI in the Models section.' : 'Only LoRAs go into the LoRA library.');

  constructor({ reader = new CivitaiModelResolver(), now = () => new Date() } = {}) {
    this._reader = reader;
    this._now = now;
  }

  async resolve(args = {}) {
    const read = await this._reader.read(args || {});
    if (read.error) return read;
    const { model, version } = read;
    const refusal = CivitaiLoraResolver.refusal(model, version);
    if (refusal) return { error: refusal };
    const file = CivitaiLoraResolver.pickFile(version, args && args.fileId);
    if (!file) return { error: `CivitAI version ${version.id} has no .safetensors LoRA file with that id.` };
    const base = CivitaiLoraBaseMap.resolve(version.baseModel);
    return {
      model,
      version,
      file,
      base,
      fileName: CivitaiLoraResolver.fileName(file),
      url: CivitaiClient.downloadUrl(version.id, { fileId: file.id }),
      record: CivitaiLoraResolver.record({ model, version, file, base, now: this._now() }),
    };
  }

  static refusal(model, version) {
    const type = model && model.type;
    if (CivitaiBaseMap.assetKind(type) !== 'lora') return CivitaiLoraResolver.NOT_A_LORA(type);
    if (type === 'DoRA') return CivitaiLoraResolver.DORA_UNSUPPORTED;
    const base = CivitaiLoraBaseMap.resolve(version && version.baseModel);
    if (!base.supported) return base.note;
    if (!CivitaiLoraResolver.pickFile(version)) return `CivitAI version ${version.id} has no .safetensors LoRA file.`;
    return null;
  }

  static pickFile(version, fileId) {
    const files = (Array.isArray(version && version.files) ? version.files : [])
      .filter((file) => file && CivitaiLoraResolver.FILE_EXT.test(String(file.name || '')));
    return CivitaiModelResolver.pickFile({ files }, fileId);
  }

  static fileName(file) {
    const stem = String(file.name).replace(CivitaiLoraResolver.FILE_EXT, '')
      .replace(CivitaiLoraResolver.UNSAFE_NAME_CHARS, '_').trim().replace(/[. ]+$/, '');
    return `${stem || `civitai-${file.id}`}.safetensors`;
  }

  static record({ model, version, file, base, now = new Date() }) {
    const origin = CivitaiModelResolver.origin({ model, version, file, now });
    return {
      source: CivitaiLoraResolver.SOURCE,
      base: base.base,
      baseModel: base.baseModel,
      label: CivitaiModelResolver.displayName(model, version),
      modelId: origin.modelId,
      versionId: origin.versionId,
      fileId: origin.fileId,
      sha256: origin.sha256,
      pageUrl: origin.pageUrl,
      creator: origin.creator,
      trigger: origin.trainedWords.map((word) => word.trim()).filter(Boolean).join(', '),
      licenseNote: CivitaiModelResolver.licenseNote(model),
      createdAt: origin.fetchedAt,
    };
  }
}

module.exports = CivitaiLoraResolver;
