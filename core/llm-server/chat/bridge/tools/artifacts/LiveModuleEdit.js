const ArtifactRetryContent = require('./ArtifactRetryContent');
const ArtifactTextEdit = require('./ArtifactTextEdit');
const FuzzyReplacement = require('./FuzzyReplacement');
const SubstringCount = require('./SubstringCount');

class LiveModuleEdit {
  static NO_EDIT = 'edit_artifact on a LIVE module: pass the new "html" and/or "js" (and optional "libs") to replace those fields, '
    + 'OR "replacements" ([{find, replace, replaceAll?}]) for targeted edits to the html/js. '
    + 'Do NOT pass a single "content" blob with an embedded <script>; that is not how live modules are stored or run.';

  static EMPTY = 'edit_artifact: the live module would be empty; provide at least "html" or "js".';

  static apply(src, params) {
    const spec = LiveModuleEdit._spec(src);
    const repl = (params && Array.isArray(params.replacements)) ? params.replacements : null;
    const outcome = (repl && repl.length > 0)
      ? LiveModuleEdit._replace(spec, repl, (src && src.title) || 'module')
      : LiveModuleEdit._replaceFields(spec, params);
    if (outcome) return { ok: false, error: outcome };
    if (!spec.html && !spec.js) return { ok: false, error: LiveModuleEdit.EMPTY };
    return { ok: true, html: spec.html, js: spec.js, libs: spec.libs };
  }

  static _spec(src) {
    let spec = {};
    try { spec = JSON.parse((src && src.content) || '{}'); } catch (_) { spec = {}; }
    return {
      html: typeof spec.html === 'string' ? spec.html : '',
      js: typeof spec.js === 'string' ? spec.js : '',
      libs: Array.isArray(spec.libs) ? spec.libs.map(String) : [],
    };
  }

  static _replaceFields(spec, params) {
    const hasHtml = params && typeof params.html === 'string';
    const hasJs = params && typeof params.js === 'string';
    const hasLibs = params && Array.isArray(params.libs);
    if (!hasHtml && !hasJs && !hasLibs) return LiveModuleEdit.NO_EDIT;
    if (hasHtml) spec.html = params.html;
    if (hasJs) spec.js = params.js;
    if (hasLibs) spec.libs = params.libs.map(String);
    return null;
  }

  static _replace(spec, repl, title) {
    for (let i = 0; i < repl.length; i++) {
      const error = ArtifactTextEdit.invalidReplacement(repl[i], i) || LiveModuleEdit._replaceOne(spec, repl[i], i, title);
      if (error) return error;
    }
    return null;
  }

  static _replaceOne(spec, r, i, title) {
    const inHtml = SubstringCount.count(spec.html, r.find);
    const inJs = SubstringCount.count(spec.js, r.find);
    if (inHtml === 1 && inJs === 0) { spec.html = spec.html.replace(r.find, r.replace); return null; }
    if (inJs === 1 && inHtml === 0) { spec.js = spec.js.replace(r.find, r.replace); return null; }
    if (r.replaceAll && (inHtml > 0 || inJs > 0)) {
      if (inHtml > 0) spec.html = spec.html.split(r.find).join(r.replace);
      if (inJs > 0) spec.js = spec.js.split(r.find).join(r.replace);
      return null;
    }
    if (inHtml > 0 && inJs > 0) {
      return `edit_artifact replacements[${i}]: "find" appears in BOTH the html and the js. Add surrounding context so it identifies one, or set "replaceAll": true.`;
    }
    if (inHtml > 1 || inJs > 1) {
      return `edit_artifact replacements[${i}]: "find" matches ${Math.max(inHtml, inJs)} locations. Add more context to make it unique, or set "replaceAll": true.`;
    }
    return LiveModuleEdit._replaceFuzzy(spec, r, i, title);
  }

  static _replaceFuzzy(spec, r, i, title) {
    const fzHtml = FuzzyReplacement.apply(spec.html, r.find, r.replace, !!r.replaceAll);
    const fzJs = FuzzyReplacement.apply(spec.js, r.find, r.replace, !!r.replaceAll);
    if (fzHtml.ok && !fzJs.ok) { spec.html = fzHtml.buf; return null; }
    if (fzJs.ok && !fzHtml.ok) { spec.js = fzJs.buf; return null; }
    if (fzHtml.ok && fzJs.ok) {
      return `edit_artifact replacements[${i}]: "find" matches both the html and the js (ignoring whitespace). Add more context, or set "replaceAll": true.`;
    }
    return `edit_artifact replacements[${i}]: "find" was not present in the module's html or js (tried exact and whitespace-normalized matching). `
      + 'Retry with a "find" copied exactly from the current html/js below, or pass a full "html"/"js" instead.'
      + ArtifactRetryContent.forLiveModule(title, spec.html, spec.js);
  }
}

module.exports = LiveModuleEdit;
