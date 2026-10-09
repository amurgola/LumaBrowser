const ModelFamilyTable = require('./ModelFamilyTable');

class ModelFamilies {
  static detect(model) {
    if (!model || typeof model !== 'object') return null;
    return ModelFamilies._detectByArchitecture(model) || ModelFamilies._detectByName(model);
  }

  static launchArgs(family, unsupported = new Set()) {
    const profile = ModelFamilies._profileOf(family);
    if (!profile) return { args: [], skipped: [], profile: null };
    const out = { args: [], skipped: [], profile };
    ModelFamilies._appendSamplerFlags(out, profile, unsupported);
    ModelFamilies._appendPlainFlags(out, profile, unsupported);
    return out;
  }

  static speculativeArgs(family, { drafterPath, flagsSupported, gpuOffload, dialect = 'mainline' } = {}) {
    const profile = ModelFamilies._profileOf(family);
    const spec = profile && profile.speculative;
    if (!spec || !drafterPath || !flagsSupported) return null;
    const args = dialect === 'ik'
      ? ModelFamilies._ikSpecArgs(spec, drafterPath)
      : ModelFamilies._mainlineSpecArgs(spec, drafterPath);
    if (gpuOffload) args.push('-ngld', '99');
    return { args, specType: spec.specType, draftNMax: spec.draftNMax, label: spec.label };
  }

  static mtpDraftNMax(family) {
    const profile = ModelFamilies._profileOf(family);
    const n = profile && profile.mtpDraftNMax;
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  static penaltyHostile(family) {
    return ModelFamilies._flag(family, 'penaltyHostile');
  }

  static nativeToolCalls(family) {
    return ModelFamilies._flag(family, 'nativeToolCalls');
  }

  static nativeToolCallsCapable(family) {
    return ModelFamilies._flag(family, 'nativeToolCalls') || ModelFamilies._flag(family, 'nativeToolCallsCapable');
  }

  static nativeToolExclude(family) {
    const profile = ModelFamilies._profileOf(family);
    return (profile && Array.isArray(profile.nativeToolExclude)) ? profile.nativeToolExclude.slice() : [];
  }

  static kvQuantUnsafe(family) {
    return ModelFamilies._flag(family, 'kvQuantUnsafe');
  }

  static ngramSpec(family) {
    return ModelFamilies._flag(family, 'ngramSpec');
  }

  static _detectByArchitecture(model) {
    const gguf = model.gguf || null;
    const arch = String((gguf && gguf.architecture) || '').toLowerCase().trim();
    if (!arch) return null;
    return ModelFamilies._findFamily((f) => f.architectures.includes(arch));
  }

  static _detectByName(model) {
    const haystack = ModelFamilies._nameHaystack(model);
    if (!haystack.trim()) return null;
    return ModelFamilies._findFamily((f) => !!f.namePattern && f.namePattern.test(haystack));
  }

  static _nameHaystack(model) {
    const gguf = model.gguf || null;
    const weights = Array.isArray(model.weights) ? model.weights.map((w) => (w && w.name) || '') : [];
    return [model.name || '', (gguf && gguf.name) || '', ...weights].join(' ');
  }

  static _findFamily(predicate) {
    const hit = Object.entries(ModelFamilyTable.FAMILIES).find(([, f]) => predicate(f));
    return hit ? hit[0] : null;
  }

  static _appendSamplerFlags(out, profile, unsupported) {
    for (const [key, value] of Object.entries(profile.samplerDefaults || {})) {
      const flag = ModelFamilyTable.SAMPLER_CLI[key];
      if (!flag) continue;
      if (unsupported.has(flag)) { out.skipped.push(flag); continue; }
      out.args.push(flag, String(value));
    }
  }

  static _appendPlainFlags(out, profile, unsupported) {
    for (const flag of profile.flags || []) {
      if (unsupported.has(flag)) { out.skipped.push(flag); continue; }
      out.args.push(flag);
    }
  }

  static _ikSpecArgs(spec, drafterPath) {
    return ['-md', drafterPath, '--spec-type', `${spec.specType.replace(/^draft-/, '')}:n_max=${spec.draftNMax}`];
  }

  static _mainlineSpecArgs(spec, drafterPath) {
    return ['--spec-type', spec.specType, '--spec-draft-n-max', String(spec.draftNMax), '-md', drafterPath];
  }

  static _flag(family, name) {
    const profile = ModelFamilies._profileOf(family);
    return !!(profile && profile[name]);
  }

  static _profileOf(family) {
    if (!family || typeof family !== 'string') return null;
    return Object.hasOwn(ModelFamilyTable.FAMILIES, family) ? ModelFamilyTable.FAMILIES[family] : null;
  }
}

module.exports = ModelFamilies;
