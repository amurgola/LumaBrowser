import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class LibraryScanMarkup {
  static SKIPPED_LIMIT = 50;

  static head(text, withPicker) {
    const esc = HtmlEscaper.escape;
    return '<div class="ml-scan-head">'
      + '<button class="luma-btn luma-btn--sm ml-scan-btn" type="button" data-ml-scan="run">Scan other tools\' libraries</button>'
      + (withPicker ? '<button class="luma-btn luma-btn--sm ml-scan-btn" type="button" data-ml-scan="pick">Choose a folder</button>' : '')
      + '<span class="ml-scan-note">' + esc(text.note) + '</span>'
      + '</div>'
      + '<div class="ml-scan-body" hidden></div>';
  }

  static results(view, skipped, text) {
    const esc = HtmlEscaper.escape;
    const skippedNote = LibraryScanMarkup._skipped(skipped);
    if (!view.models.length) return '<div class="ml-scan-empty">' + esc(text.empty) + '</div>' + skippedNote;
    const found = view.shown;
    return '<div class="ml-scan-sub">Found ' + esc(view.bySource) + '.</div>'
      + '<div class="ml-scan-list">' + found.map(LibraryScanMarkup._row).join('') + '</div>'
      + (view.more > 0 ? '<div class="ml-scan-sub">...and ' + view.more + ' more. ' + esc(text.more) + '</div>' : '')
      + (found.filter((m) => !m.adopted).length > 1
        ? '<button class="luma-btn luma-btn--sm ml-scan-all" type="button" data-ml-scan="import-all">Import all</button>' : '')
      + skippedNote;
  }

  static failure(error) {
    return '<div class="ml-scan-empty">Scan failed' + (error ? ': ' + HtmlEscaper.escape(error) : '') + '.</div>';
  }

  static _row(m, i) {
    const esc = HtmlEscaper.escape;
    return '<div class="ml-scan-row" data-ml-scan-row="' + i + '">'
      + '<span class="ml-scan-name" title="' + esc(m.path) + '">' + esc(m.name) + '</span>'
      + '<span class="ml-scan-meta">' + esc(m.sourceLabel) + (m.archLabel ? ' · ' + esc(m.archLabel) : '') + ' · '
      + esc(ByteFormatter.gb(m.bytes)) + '</span>'
      + (m.adopted ? '' : '<button class="luma-btn luma-btn--sm primary ml-scan-import" type="button" data-ml-scan="import" data-idx="' + i + '">Import</button>')
      + '<span class="ml-scan-status">' + (m.adopted ? 'Already in your models folder' : '') + '</span>'
      + '</div>';
  }

  static _skipped(skipped) {
    if (!skipped.length) return '';
    const esc = HtmlEscaper.escape;
    return '<details class="ml-scan-sub"><summary>' + skipped.length + ' other file'
      + (skipped.length === 1 ? '' : 's') + ' found that cannot be linked</summary>'
      + skipped.slice(0, LibraryScanMarkup.SKIPPED_LIMIT).map((m) => '<div title="' + esc(m.path) + '">' + esc(m.name)
        + ' (' + esc(m.archLabel || '') + '): ' + esc(m.reason || '') + '</div>').join('')
      + '</details>';
  }
}
