const SafetensorsHeader = require('./SafetensorsHeader');
const LoraBaseDetector = require('./LoraBaseDetector');
const LoraRepacker = require('./LoraRepacker');

class LoraInspector {
  static FORM_MARKERS = [
    { form: 'lokr', re: /\.lokr_w[12]/ },
    { form: 'loha', re: /\.hada_w[12]_[ab]/ },
    { form: 'lora', re: /\.lora_(?:down|up)(?:\.weight)?$/ },
    { form: 'lora', re: /\.lora_[AB](?:\.weight)?$/ },
    { form: 'diff', re: /\.diff(?:_b)?$/ },
  ];

  static inspect(filePath) {
    const header = LoraInspector._readHeader(filePath);
    if (header.error) return { ok: false, error: header.error };
    const keys = SafetensorsHeader.tensorNames(header.json);
    const form = LoraInspector._formOf(keys);
    const detection = LoraInspector._detectBase(keys, SafetensorsHeader.metadata(header.json));
    return LoraInspector._result(keys, form, detection);
  }

  static _readHeader(filePath) {
    try {
      return { json: SafetensorsHeader.readFile(filePath).json };
    } catch (err) {
      return { error: err.message };
    }
  }

  static _formOf(keys) {
    const marker = LoraInspector.FORM_MARKERS.find((m) => keys.some((k) => m.re.test(k)));
    return marker ? marker.form : null;
  }

  static _detectBase(keys, metadata) {
    const metaBase = metadata.ss_base_model_version || metadata['modelspec.architecture'] || metadata.base_model;
    const fromMeta = metaBase ? LoraBaseDetector.fromMetadata(metaBase) : null;
    if (fromMeta) return { baseId: fromMeta, source: 'metadata', metaBase };
    const fromKeys = LoraBaseDetector.fromKeys(keys);
    return { baseId: fromKeys, source: fromKeys ? 'keys' : null, metaBase };
  }

  static _result(keys, form, { baseId, source, metaBase }) {
    const known = baseId ? LoraBaseDetector.BASES[baseId] : null;
    const isLora = !!form;
    return {
      ok: true,
      isLora,
      form,
      base: LoraInspector._baseLabel(baseId, known, metaBase),
      families: known ? known.families.slice() : [],
      source,
      keyCount: keys.length,
      needsFusedMlpRepack: isLora && LoraRepacker.needsFusedMlpAliases(keys),
    };
  }

  static _baseLabel(baseId, known, metaBase) {
    if (baseId) return { id: baseId, label: known ? known.label : String(metaBase || baseId) };
    return metaBase ? { id: null, label: String(metaBase) } : null;
  }
}

module.exports = LoraInspector;
