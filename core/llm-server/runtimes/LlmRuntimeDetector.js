const RuntimeDetector = require('../../shared/runtime/RuntimeDetector');
const LlamaBuildNumber = require('../../shared/runtime/detect/LlamaBuildNumber');
const LlmRuntimeCatalog = require('./LlmRuntimeCatalog');

class LlmRuntimeDetector extends RuntimeDetector {
  static NESTED_BUILD = /\bbuild\s+(\d+)(?:,\s*commit\s+([0-9a-f]{5,}))?/i;
  static FLAT_VERSION = /version[:\s]+b?(\d+)(?:\s*\(([0-9a-f]{5,})\))?/i;
  static ARGPARSE_NOISE = /usage:|unrecognized arguments|invalid choice|error:/i;

  static shared = new LlmRuntimeDetector();

  constructor(catalog = LlmRuntimeCatalog.shared) {
    super({ catalog, expectedKind: 'inference' });
  }

  parseVersionOutput(stdout, stderr) {
    const text = `${stdout}\n${stderr}`;
    const match = text.match(LlmRuntimeDetector.NESTED_BUILD) || text.match(LlmRuntimeDetector.FLAT_VERSION);
    if (match) return LlmRuntimeDetector._buildLabel(match[1], match[2]);
    if (LlmRuntimeDetector.ARGPARSE_NOISE.test(text)) return null;
    return LlmRuntimeDetector._firstLine(text);
  }

  _rollUp({ entries, detectedById, results }) {
    for (const entry of entries) {
      if (entry.kind === 'inference') continue;
      results.push(this._formatRow(entry, detectedById));
    }
  }

  _formatRow(entry, detectedById) {
    const row = this._emptyFormatRow(entry);
    for (const dependency of this._installedDependencies(entry, detectedById)) {
      const provider = this._providerFor(entry, dependency);
      if (!provider) continue;
      row.installed = true;
      row.providedBy.push(provider);
    }
    return row;
  }

  _emptyFormatRow(entry) {
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      description: entry.description,
      installed: false,
      providedBy: [],
      minLlamaBuild: entry.minLlamaBuild || null,
    };
  }

  _installedDependencies(entry, detectedById) {
    return (entry.dependsOn || [])
      .map((id) => detectedById.get(id))
      .filter((dependency) => dependency && dependency.installed);
  }

  _providerFor(entry, dependency) {
    if (!entry.minLlamaBuild) return { id: dependency.id, version: dependency.version };
    const build = LlmRuntimeDetector._buildNumberOf(dependency);
    if (!build || build < entry.minLlamaBuild) return null;
    return { id: dependency.id, version: dependency.version, buildNumber: build };
  }

  static _buildNumberOf(detail) {
    const tag = detail.manifest && detail.manifest.release && detail.manifest.release.tag;
    return LlamaBuildNumber.parse(tag) || LlamaBuildNumber.parse(detail.version);
  }

  static _buildLabel(build, commit) {
    return commit ? `b${build} (${commit})` : `b${build}`;
  }

  static _firstLine(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\r?\n/)[0] : null;
  }
}

module.exports = LlmRuntimeDetector;
