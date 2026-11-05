import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ProgressPercent from './ProgressPercent.js';

export default class DownloadDetail {
  static html(dl) {
    const esc = HtmlEscaper.escape;
    const pct = ProgressPercent.of(dl.received, dl.total);
    const filesLine = dl.totalFiles
      ? `File ${(dl.index || 0) + 1} of ${dl.totalFiles}${dl.role ? ' · ' + esc(dl.role) : ''}`
      : (dl.role || '');
    const bytes = pct == null
      ? 'starting…'
      : pct + '% · ' + ByteFormatter.bytes(dl.received) + (dl.total ? ' of ' + ByteFormatter.bytes(dl.total) : '');
    const recipe = DownloadDetail.recipeLine(dl.recipe);
    return `
      <div class="fit-progress">
        <span>${esc(filesLine)}</span>
        <div class="luma-progress"><div class="luma-progress-fill" style="width:${pct == null ? 30 : pct}%"></div></div>
        <span class="fit-note">${bytes}</span>
        ${recipe ? `<span class="fit-note img-dl-recipe">${esc(recipe)}</span>` : ''}
      </div>`;
  }

  static recipeLine(recipe) {
    if (!recipe || !recipe.stage) return '';
    if (recipe.stage === 'reading') return 'Reading the CivitAI page and sample images for recommended settings…';
    if (recipe.stage === 'failed') return 'Could not read CivitAI recommendations; using the base settings.';
    const sources = recipe.sources || {};
    const keys = Object.keys(sources);
    if (keys.length === 0) return 'No creator recommendations found; using the base settings.';
    const from = (name) => keys.filter((k) => sources[k] === name);
    const parts = [];
    if (from('description').length) parts.push(`${from('description').join(', ')} from the model page`);
    if (from('images').length) parts.push(`${from('images').join(', ')} from ${recipe.imageSamples || 'the'} sample images`);
    const warn = Array.isArray(recipe.warnings) && recipe.warnings.length ? ` ${recipe.warnings[0]}` : '';
    return `Settings: ${parts.join('; ')}.${warn}`;
  }
}
