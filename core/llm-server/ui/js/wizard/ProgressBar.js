export default class ProgressBar {
  static set(bar, fill, fraction) {
    const indeterminate = fraction == null;
    if (bar) bar.classList.toggle('indeterminate', indeterminate);
    if (fill) fill.style.width = indeterminate ? '' : (Math.max(0, Math.min(1, fraction)) * 100 + '%');
  }
}
