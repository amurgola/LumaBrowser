import HtmlEscaper from '../format/HtmlEscaper.js';
import Dom from '../dom/Dom.js';

export default class LoadingSteps {
  static STEP_MS = 1800;

  static mount(body, steps, timers, stepMs) {
    const box = Dom.el('div', 'wz-loading');
    box.innerHTML = '<span class="luma-spinner luma-spinner--lg"></span>'
      + '<ul class="wz-loading-steps">'
      + steps.map((t, i) => '<li' + (i === 0 ? ' class="on"' : '') + '>' + HtmlEscaper.escape(t) + '</li>').join('')
      + '</ul>';
    body.appendChild(box);
    const items = box.querySelectorAll('li');
    let index = 0;
    timers.add(setInterval(() => {
      if (index >= items.length - 1) return;
      items[index].className = 'done';
      index++;
      items[index].className = 'on';
    }, stepMs || LoadingSteps.STEP_MS));
    return box;
  }
}
