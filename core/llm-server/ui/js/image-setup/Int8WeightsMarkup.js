import ByteFormatter from '../format/ByteFormatter.js';
import HtmlEscaper from '../format/HtmlEscaper.js';
import ProgressPercent from './ProgressPercent.js';

export default class Int8WeightsMarkup {
  static CAPTION = 'INT8 copy of the weights, about 1.6 times faster on NVIDIA cards';

  static html(id, int8, building) {
    if (!int8) return '';
    const progress = building || int8.building;
    if (progress) return Int8WeightsMarkup._building(id, progress);
    if (int8.present) return Int8WeightsMarkup._present(id, int8);
    if (int8.buildable) return Int8WeightsMarkup._absent(id, int8);
    return '';
  }

  static caption(estimatedBytes) {
    return estimatedBytes ? `${Int8WeightsMarkup.CAPTION}, ${ByteFormatter.gb(estimatedBytes)} more disk` : Int8WeightsMarkup.CAPTION;
  }

  static _absent(id, int8) {
    return `
      <div class="fit-progress">
        <button class="luma-btn luma-btn--sm" data-ml-act="int8-build" data-id="${HtmlEscaper.escape(id)}">Build faster weights</button>
        <span class="fit-note">${HtmlEscaper.escape(Int8WeightsMarkup.caption(int8.estimatedBytes))}</span>
      </div>`;
  }

  static _building(id, progress) {
    const pct = ProgressPercent.of(progress.doneBytes, progress.totalBytes);
    const bytes = pct == null ? 'starting…' : `${pct}% · ${ByteFormatter.bytes(progress.doneBytes)} of ${ByteFormatter.bytes(progress.totalBytes)}`;
    return `
      <div class="fit-progress">
        <span>Building faster weights</span>
        <div class="luma-progress"><div class="luma-progress-fill" style="width:${pct == null ? 30 : pct}%"></div></div>
        <span class="fit-note">${bytes}</span>
        <button class="luma-btn luma-btn--sm" data-ml-act="int8-cancel" data-id="${HtmlEscaper.escape(id)}">Stop</button>
      </div>`;
  }

  static _present(id, int8) {
    const size = int8.bytes ? ` · ${ByteFormatter.bytes(int8.bytes)}` : '';
    return `
      <div class="fit-progress">
        <span class="fit-note" title="Used when the image runtime is a CUDA build">Faster weights (INT8) in use${size}</span>
        <button class="luma-btn luma-btn--sm" data-ml-act="int8-remove" data-id="${HtmlEscaper.escape(id)}" title="Delete the INT8 copy">Remove</button>
      </div>`;
  }
}
