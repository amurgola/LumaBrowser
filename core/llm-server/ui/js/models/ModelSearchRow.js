import HtmlEscaper from '../format/HtmlEscaper.js';
import SearchText from './SearchText.js';

export default class ModelSearchRow {
  static html(model) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const facts = ModelSearchRow.facts(model);
    return '<div class="ms-row-id">' + esc(model.repoId) + (model.gated ? ' <span class="ms-gated">gated</span>' : '') + '</div>'
      + (facts ? '<div class="ms-row-facts">' + facts + '</div>' : '')
      + '<div class="ms-row-stats"><span>↓ ' + esc(SearchText.count(model.downloads)) + '</span>'
      + '<span>♥ ' + esc(SearchText.count(model.likes)) + '</span></div>';
  }

  static facts(model) {
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const parts = [
      model.paramsB ? ModelSearchRow.params(model.paramsB) : null,
      model.maxContext ? Math.round(model.maxContext / 1024) + 'K' : null,
      model.architecture || null,
    ].filter(Boolean);
    if (!parts.length) return '';
    const fit = model.fit || null;
    const dot = fit ? '<span class="ms-badge ' + esc(fit.badge || 'green') + '" title="' + esc(SearchText.fitLabel(fit)) + '"></span>' : '';
    return dot + '<span>' + esc(parts.join(' · ')) + '</span>';
  }

  static params(paramsB) {
    const n = Number(paramsB) || 0;
    if (n >= 10) return Math.round(n) + 'B';
    return n.toFixed(1).replace(/\.0$/, '') + 'B';
  }

  static statusHtml(count, query, hidden) {
    if (!count) return 'No matches.';
    const esc = HtmlEscaper.escapeKeepingApostrophes;
    const h = hidden || {};
    const reasons = [
      h.notChat ? h.notChat + ' not chat models' : null,
      h.tooBig ? h.tooBig + ' too big for this PC' : null,
    ].filter(Boolean);
    const total = (Number(h.notChat) || 0) + (Number(h.tooBig) || 0);
    return esc(count + (query ? ' matches' : ' models'))
      + (total ? ' · <span class="ms-hidden" title="' + esc(reasons.join(', ')) + '">' + total + ' hidden</span>' : '');
  }
}
