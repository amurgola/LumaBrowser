const ArtifactRetryContent = require('./ArtifactRetryContent');
const FuzzyReplacement = require('./FuzzyReplacement');
const SubstringCount = require('./SubstringCount');

class ArtifactTextEdit {
  static AMBIGUOUS_HINT = 'Add more surrounding context so it uniquely identifies the one you mean, or set "replaceAll": true to change every occurrence.';

  static apply(src, replacements) {
    let buf = String(src.content || '');
    let fuzzyUsed = 0;
    for (let i = 0; i < replacements.length; i++) {
      const step = ArtifactTextEdit._applyOne(src, buf, replacements[i], i);
      if (step.error) return { ok: false, error: step.error };
      buf = step.buf;
      fuzzyUsed += step.fuzzy;
    }
    return { ok: true, content: buf, fuzzyUsed };
  }

  static fuzzyNote(fuzzyUsed) {
    if (fuzzyUsed <= 0) return '';
    return ` Note: ${fuzzyUsed} edit${fuzzyUsed === 1 ? '' : 's'} matched after normalizing whitespace, so the artifact's own indentation was preserved.`;
  }

  static invalidReplacement(r, i) {
    if (!r || typeof r.find !== 'string' || r.find.length === 0) {
      return `edit_artifact replacements[${i}]: "find" (non-empty string) is required.`;
    }
    if (typeof r.replace !== 'string') {
      return `edit_artifact replacements[${i}]: "replace" (string, may be empty) is required.`;
    }
    return null;
  }

  static _applyOne(src, buf, r, i) {
    const invalid = ArtifactTextEdit.invalidReplacement(r, i);
    if (invalid) return { error: invalid };
    const exact = ArtifactTextEdit._exact(buf, r, i);
    if (exact) return exact;
    return ArtifactTextEdit._fuzzy(src, buf, r, i);
  }

  static _exact(buf, r, i) {
    const matchCount = SubstringCount.count(buf, r.find);
    if (matchCount === 1 || (matchCount > 1 && r.replaceAll)) {
      const next = r.replaceAll ? buf.split(r.find).join(r.replace) : buf.replace(r.find, r.replace);
      return { buf: next, fuzzy: 0 };
    }
    if (matchCount > 1) {
      return { error: `edit_artifact replacements[${i}]: "find" matches ${matchCount} locations. ${ArtifactTextEdit.AMBIGUOUS_HINT}` };
    }
    return null;
  }

  static _fuzzy(src, buf, r, i) {
    const fz = FuzzyReplacement.apply(buf, r.find, r.replace, !!r.replaceAll);
    if (fz.ok) return { buf: fz.buf, fuzzy: fz.count };
    if (fz.code === 'ambiguous') {
      return { error: `edit_artifact replacements[${i}]: "find" matches ${fz.count} locations (ignoring whitespace). `
        + ArtifactTextEdit.AMBIGUOUS_HINT + ArtifactRetryContent.forArtifact(src) };
    }
    return { error: `edit_artifact replacements[${i}]: "find" was not present in the artifact (tried exact and whitespace-normalized matching). `
      + 'Retry with a "find" copied EXACTLY from the current content below; do NOT switch to a full "content" rewrite for a small change, that discards the existing design.'
      + ArtifactRetryContent.forArtifact(src) };
  }
}

module.exports = ArtifactTextEdit;
