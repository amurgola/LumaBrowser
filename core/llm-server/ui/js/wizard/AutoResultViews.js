import HtmlEscaper from '../format/HtmlEscaper.js';
import Clipboard from '../dom/Clipboard.js';

export default class AutoResultViews {
  static COPIED_MS = 1500;

  static progress(w, body) {
    body.innerHTML = '<div class="wz-prog">'
      + '<div class="wz-prog-phase" data-auto-phase>Preparing…</div>'
      + '<div class="luma-progress wz-bar" data-auto-bar><div class="luma-progress-fill wz-bar-fill" data-auto-fill></div></div>'
      + '<div class="wz-prog-sub" data-auto-sub></div>'
      + '<div class="wz-prog-actions">'
      + '<button class="luma-btn wz-pause" data-auto-pause type="button">Pause</button>'
      + '<button class="luma-btn wz-cancel" data-auto-cancel type="button">Cancel</button>'
      + '</div>'
      + '</div>';
    body.querySelector('[data-auto-cancel]').addEventListener('click', () => AutoResultViews._cancel(w, body));
    body.querySelector('[data-auto-pause]').addEventListener('click', () => {
      const button = body.querySelector('[data-auto-pause]');
      button.disabled = true;
      button.textContent = 'Pausing…';
      try { w.api().pauseModelDownload(); } catch (_) {}
    });
  }

  static _cancel(w, body) {
    w.state.auto.canceled = true;
    try { w.api().cancelModelDownload(); } catch (_) {}
    try { if (w.imageApi()) w.imageApi().cancelModelDownload(); } catch (_) {}
    const button = body.querySelector('[data-auto-cancel]');
    button.disabled = true;
    button.textContent = 'Canceling…';
    const pause = body.querySelector('[data-auto-pause]');
    if (pause) pause.disabled = true;
  }

  static done(w, body) {
    const A = w.state.auto;
    body.innerHTML = '<div class="wz-done"><div class="wz-done-ic"></div>'
      + '<h2>Local AI is ready</h2>'
      + '<p>' + HtmlEscaper.escape(A.modelName || 'Your local model') + ' is downloaded and running.</p>'
      + AutoResultViews.legLine(A.plan && A.plan.image, A.imageDone, A.imageError,
        '<p>Image generation is ready too.</p>', 'Image', 'images any time from the Image section.')
      + AutoResultViews.legLine(A.plan && A.plan.music, A.musicDone, A.musicError,
        '<p>Music generation is ready too. Ask for a song in chat.</p>', 'Music', 'music any time from the Music section.')
      + '<button class="luma-btn primary luma-btn--block wz-go" data-go-chat type="button">Start chatting</button></div>';
    body.querySelector('[data-go-chat]').addEventListener('click', () => w.goChat());
  }

  static legLine(planned, done, error, doneHtml, name, retryText) {
    if (!planned) return '';
    if (done) return doneHtml;
    return '<div class="luma-callout warn">' + name + ' setup did not finish ('
      + HtmlEscaper.escape(error || 'unknown error') + '). Chat works; retry ' + retryText + '</div>';
  }

  static error(w, body) {
    const A = w.state.auto;
    const sys = A.sysdeps;
    body.innerHTML = AutoResultViews.errorHtml(A.error, sys);
    const copy = body.querySelector('[data-apt-copy]');
    if (copy) copy.addEventListener('click', () => AutoResultViews._copy(copy, sys.aptLine || ''));
    body.querySelector('[data-auto-retry]').addEventListener('click', () => {
      A.error = null;
      A.canceled = false;
      if (sys) { A.sysdeps = null; w.autoFlow.run(); return; }
      A.view = A.plan ? 'plan' : 'question';
      w.render();
    });
    body.querySelector('[data-auto-guided]').addEventListener('click', () => w.startGuided());
  }

  static errorHtml(error, sys) {
    const esc = HtmlEscaper.escape;
    const unmapped = sys ? (sys.missing || []).filter((m) => !m.pkg).map((m) => m.soname) : [];
    return '<div class="luma-callout bad">' + esc(error || 'Automatic setup failed.') + '</div>'
      + (sys && sys.aptLine
        ? '<div class="preflight-cmd"><code data-apt-line>' + esc(sys.aptLine) + '</code>'
          + '<button class="luma-btn luma-btn--sm" data-apt-copy type="button">Copy</button></div>'
        : '')
      + (unmapped.length ? '<div class="wz-dim">Also needed but not in a known package: ' + esc(unmapped.join(', ')) + '</div>' : '')
      + '<div class="wz-img-actions">'
      + '<button class="luma-btn primary luma-btn--block wz-go" data-auto-retry type="button">' + (sys ? 'Check again' : 'Try again') + '</button>'
      + '<button class="luma-btn link wz-back-link" data-auto-guided type="button">Use guided setup instead</button>'
      + '</div>';
  }

  static async _copy(button, text) {
    if (!(await Clipboard.copyText(text))) return;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = 'Copy'; }, AutoResultViews.COPIED_MS);
  }
}
