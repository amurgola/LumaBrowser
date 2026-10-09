import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ExistingImagePlan from './ExistingImagePlan.js';
import ExistingLibraryView from './ExistingLibraryView.js';

export default class AutoImageChoice {
  static LIMIT = 40;

  static mount(host, opts) {
    if (!host) return;
    const plan = opts && opts.plan;
    const choices = ExistingImagePlan.choices(opts && opts.scan, plan);
    if (!choices.length) { host.innerHTML = ''; return; }
    const view = ExistingLibraryView.view({ models: choices, sources: AutoImageChoice._countSources(choices) }, { limit: AutoImageChoice.LIMIT });
    host.innerHTML = AutoImageChoice._html(plan, choices, view, (opts && opts.className) || '');
    host.querySelector('[data-auto-image-choice]').addEventListener('change', (event) => {
      const value = event.target.value;
      opts.onChange(value === '' ? null : (view.shown[Number(value)] || null));
    });
  }

  static _countSources(choices) {
    return choices.reduce((acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    }, {});
  }

  static _html(plan, choices, view, className) {
    const esc = HtmlEscaper.escape;
    const planned = plan.image.planned || plan.image;
    const current = plan.image.found ? plan.image.found.path : '';
    return '<label class="' + esc(className) + '" style="display:block; margin-top:10px;">'
      + '<span>You already have ' + choices.length + ' image model' + (choices.length === 1 ? '' : 's')
      + ' (' + esc(view.bySource) + '). Use one and skip the image download:</span>'
      + '<select data-auto-image-choice style="display:block; width:100%; margin-top:6px;">'
      + '<option value="">Download the recommended model: ' + esc(planned.label || '')
      + (planned.approxTotalBytes ? ' (' + ByteFormatter.gb(planned.approxTotalBytes) + ')' : '') + '</option>'
      + view.shown.map((m, i) => AutoImageChoice._optionHtml(m, i, current)).join('')
      + '</select></label>';
  }

  static _optionHtml(m, index, current) {
    const sep = ' · ';
    const text = 'Use ' + m.name + sep + (m.archLabel || '') + sep + m.sourceLabel + sep + ByteFormatter.gb(m.bytes) + sep + 'no download';
    return '<option value="' + index + '"' + (m.path === current ? ' selected' : '') + '>' + HtmlEscaper.escape(text) + '</option>';
  }
}
