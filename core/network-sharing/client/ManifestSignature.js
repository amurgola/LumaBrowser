class ManifestSignature {
  static of(manifest) {
    if (!manifest) return '';
    const llms = manifest.llms || [];
    const image = manifest.image || {};
    const generate = image.generate || {};
    const edit = image.edit || {};
    return [
      llms.map((model) => `${model.ref}${model.label}`).join(''),
      llms.map((model) => Number(model && model.contextWindow) || 0).join(','),
      !!generate.available, generate.modelLabel || '', ManifestSignature._modelIds(generate),
      !!edit.available, edit.modelLabel || '', ManifestSignature._modelIds(edit),
      ManifestSignature._gpus(manifest.gpus),
    ].join('');
  }

  static _modelIds(slot) {
    return Array.isArray(slot.models) ? slot.models.map((model) => model && model.id).join(',') : '';
  }

  static _gpus(gpus) {
    if (!gpus || !gpus.available || !Array.isArray(gpus.devices)) return '';
    return gpus.devices.map((device) => `${device.index}:${device.name}:${device.vramTotalMB}`).join(',');
  }
}

module.exports = ManifestSignature;
