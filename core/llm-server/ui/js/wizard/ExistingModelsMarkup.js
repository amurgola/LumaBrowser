import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';

export default class ExistingModelsMarkup {
  static html(view, opts) {
    const esc = HtmlEscaper.escape;
    const count = view.models.length;
    return '<details class="wz-adv wz-existing"' + (opts.open ? ' open' : '') + '>'
      + '<summary>You already have ' + count + ' ' + opts.noun + (count === 1 ? '' : 's')
      + ' on this machine. Use one instead</summary>'
      + '<div class="wz-dim wz-existing-sub">Found ' + esc(view.bySource)
      + '. Nothing is copied or moved: LumaBrowser links to the file where it already is.</div>'
      + '<div class="wz-existing-list">'
      + view.shown.map((m, i) => ExistingModelsMarkup._row(m, i, opts.withArch)).join('')
      + '</div>'
      + (view.more > 0 ? '<div class="wz-dim">...and ' + view.more + ' more. ' + opts.moreText + '</div>' : '')
      + '</details>';
  }

  static _row(m, index, withArch) {
    const esc = HtmlEscaper.escape;
    return '<button class="wz-existing-row" type="button" data-existing="' + index + '">'
      + '<span class="wz-existing-name">' + esc(m.name) + '</span>'
      + '<span class="wz-existing-meta">' + esc(m.sourceLabel) + (withArch ? ' · ' + esc(m.archLabel || '') : '')
      + ' · ' + ByteFormatter.gb(m.bytes) + '</span>'
      + '</button>';
  }

  static wire(host, shown, onPick) {
    host.querySelectorAll('[data-existing]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = shown[Number(btn.dataset.existing)];
        if (picked) onPick(picked);
      });
    });
  }
}
