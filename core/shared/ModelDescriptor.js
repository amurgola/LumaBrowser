class ModelDescriptor {
  static IMAGE_INSTALLED_FEATURES = ['pin', 'move', 'remove'];

  static toLlmDescriptor(m) {
    const name = (m && (m.displayName || m.name)) || '';
    const nameKey = (m && (m.nameKey || m.name)) || '';
    return {
      key: nameKey,
      domain: 'llm',
      section: 'installed',
      name,
      originalFileName: name !== nameKey ? nameKey : '',
      sizeBytes: (m && m.totalBytes) || 0,
      info: ModelDescriptor._llmInfo(m),
      tags: ModelDescriptor._llmTags(m),
      interfaces: (m && Array.isArray(m.compatibleRuntimes)) ? m.compatibleRuntimes.slice() : [],
      features: ModelDescriptor._llmFeatures(m),
      raw: m,
    };
  }

  static toImageInstalledDescriptor(m) {
    const fileKeys = ModelDescriptor._imageFileNames(m && m.files);
    return {
      key: (m && m.id) || '',
      domain: 'image',
      section: 'installed',
      name: (m && (m.label || m.id)) || '',
      originalFileName: '',
      sizeBytes: fileKeys.reduce((sum, k) => sum + ((m.files[k] && m.files[k].bytes) || 0), 0),
      info: ModelDescriptor._imageInfo((m && m.dir) || '', fileKeys),
      tags: ModelDescriptor._imageInstalledTags(m),
      interfaces: (m && m.protocol) ? [m.protocol] : [],
      features: ModelDescriptor.IMAGE_INSTALLED_FEATURES.map((id) => ({ id, kind: 'action' })),
      meta: { kind: ModelDescriptor._normImageKind(m && m.kind), licenseNote: (m && m.licenseNote) || '' },
      raw: m,
    };
  }

  static toImageCatalogDescriptor(entry, installed) {
    return {
      key: (entry && entry.id) || '',
      domain: 'image',
      section: 'catalog',
      name: (entry && (entry.label || entry.id)) || '',
      originalFileName: '',
      sizeBytes: ModelDescriptor._catalogApproxBytes(entry),
      info: ModelDescriptor._imageInfo('', ModelDescriptor._imageFileNames(entry && entry.files)),
      tags: ModelDescriptor._imageCatalogTags(entry),
      interfaces: (entry && entry.protocol) ? [entry.protocol] : [],
      features: ModelDescriptor._imageCatalogFeatures(entry),
      meta: {
        kind: ModelDescriptor._normImageKind(entry && entry.kind),
        blurb: (entry && entry.blurb) || '',
        licenseNote: (entry && entry.licenseNote) || '',
        installed: Array.isArray(installed) && installed.some((x) => x && x.id === entry.id),
      },
      raw: entry,
    };
  }

  static _tag(label, variant, group) {
    return { label: String(label), variant: variant || 'muted', group: group || 'feature' };
  }

  static _parsedGguf(m) {
    const gguf = m && m.gguf;
    return gguf && gguf.parsed ? gguf : null;
  }

  static _llmInfo(m) {
    const gguf = ModelDescriptor._parsedGguf(m);
    return {
      arch: (gguf && gguf.architecture) || null,
      layers: (gguf && gguf.blockCount) || null,
      nativeCtx: (gguf && gguf.contextLength) || null,
      fileType: (gguf && gguf.fileTypeName) || null,
      path: (m && m.relativeDirectory) || '',
      files: (m && Array.isArray(m.weights)) ? m.weights.map((w) => w.name) : [],
    };
  }

  static _weightsCount(m) {
    return (m && m.weightsCount) || (m && m.weights && m.weights.length) || 0;
  }

  static _llmTags(m) {
    const tags = [];
    const gguf = ModelDescriptor._parsedGguf(m);
    if (gguf && gguf.architecture) tags.push(ModelDescriptor._tag(gguf.architecture, 'muted', 'arch'));
    if (m && m.mtpCapable) tags.push(ModelDescriptor._tag('MTP', 'accent', 'feature'));
    const shardTag = ModelDescriptor._shardTag(m);
    if (shardTag) tags.push(shardTag);
    if (m && Array.isArray(m.mmproj) && m.mmproj.length > 0) tags.push(ModelDescriptor._tag('mmproj', 'muted', 'feature'));
    if (m && Array.isArray(m.mtp) && m.mtp.length > 0) tags.push(ModelDescriptor._tag('MTP head', 'muted', 'feature'));
    if (m && (m.kind === 'mmproj-only' || m.kind === 'mtp-only')) tags.push(ModelDescriptor._tag(m.kind, 'common', 'kind'));
    return tags;
  }

  static _shardTag(m) {
    const count = ModelDescriptor._weightsCount(m);
    const expected = (m && m.weightsExpectedShards) || 0;
    if (count <= 1 && expected <= 1) return null;
    const complete = expected === count;
    const label = `${count}/${expected} shards${complete ? '' : ' · incomplete'}`;
    return ModelDescriptor._tag(label, complete ? 'ok' : 'common', 'shard');
  }

  static _llmFeatures(m) {
    const features = [{ id: 'rename', kind: 'action' }];
    const isWeights = m && m.kind === 'weights';
    const gguf = ModelDescriptor._parsedGguf(m);
    if (isWeights && gguf && gguf.blockCount) features.push({ id: 'ctxfit', kind: 'block' });
    if (isWeights && m.weights && m.weights[0]) features.push({ id: 'fit', kind: 'block' });
    if (ModelDescriptor._weightsCount(m) > 1) features.push({ id: 'shards', kind: 'block' });
    return features;
  }

  static _imageInfo(path, files) {
    return { arch: null, layers: null, nativeCtx: null, fileType: null, path, files };
  }

  static _imageKindTag(kind, supportsEdit) {
    let label = supportsEdit ? 'generation + edit' : 'generation';
    if (kind === 'edit' || kind === 'video') label = kind;
    return ModelDescriptor._tag(label, kind === 'video' ? 'accent' : 'muted', 'kind');
  }

  static _normImageKind(kind) {
    return (kind === 'edit' || kind === 'video') ? kind : 'generate';
  }

  static _imageFileNames(files) {
    if (!files) return [];
    return Object.keys(files).filter((k) => files[k] && (files[k].path || files[k].file));
  }

  static _imageInstalledTags(m) {
    const tags = [ModelDescriptor._imageKindTag(m && m.kind, !!(m && m.supportsEdit))];
    if (m && m.licenseNote) tags.push(ModelDescriptor._tag('NC', 'warn', 'license'));
    if (m && m.manifest && m.manifest.imported) tags.push(ModelDescriptor._tag('imported', 'accent', 'origin'));
    return tags;
  }

  static _imageCatalogTags(entry) {
    const tags = [ModelDescriptor._imageKindTag(entry && entry.kind, !!(entry && entry.supportsEdit))];
    if (entry && entry.licenseNote) tags.push(ModelDescriptor._tag('NC', 'warn', 'license'));
    return tags;
  }

  static _imageCatalogFeatures(entry) {
    const features = [{ id: 'download', kind: 'action' }];
    if (entry && entry.blurb) features.push({ id: 'blurb', kind: 'block' });
    const diffusion = entry && entry.files && entry.files.diffusion;
    if (diffusion && Array.isArray(diffusion.quants) && diffusion.quants.length > 1) {
      features.push({ id: 'quant', kind: 'block' });
    }
    return features;
  }

  static _catalogApproxBytes(entry) {
    if (!entry || !entry.files) return 0;
    return Object.keys(entry.files).reduce((sum, k) => sum + ((entry.files[k] && entry.files[k].approxBytes) || 0), 0);
  }
}

module.exports = ModelDescriptor;
