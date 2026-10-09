export default class UsageMeter {
  static DEFAULT_TITLE = 'Tokens used by the last turn';

  constructor(ctx) {
    this._ctx = ctx;
  }

  static num(n) {
    return Number(n || 0).toLocaleString();
  }

  render() {
    const u = this._ctx.state.lastUsage;
    const win = u ? (u.window || this._ctx.models.activeCtxWindow()) : null;
    const { html, title } = UsageMeter.view(u, win);
    this._ctx.root.querySelectorAll('.cm-usage').forEach((e) => {
      e.innerHTML = html;
      e.title = title;
    });
  }

  static view(u, win) {
    if (!u || !(u.in || u.out)) return { html: '', title: UsageMeter.DEFAULT_TITLE };
    const used = (u.in || 0) + (u.out || 0);
    if (!win) {
      return { html: '↑' + UsageMeter.num(u.in) + ' ↓' + UsageMeter.num(u.out), title: u.in + ' prompt + ' + u.out + ' completion tokens' };
    }
    const pct = Math.min(100, Math.round((used / win) * 100));
    const bar = '<span class="cm-ctx-bar' + (pct >= 90 ? ' hot' : pct >= 75 ? ' warm' : '') + '" aria-hidden="true"><span style="width:'
      + pct + '%"></span></span>';
    return {
      html: bar + '<span class="cm-ctx-pct"><b>' + pct + '%</b>'
        + ' <span class="cm-ctx-num">' + UsageMeter.num(used) + '/' + UsageMeter.num(win) + '</span></span>',
      title: used + ' of ' + win + ' tokens of context used (' + pct + '%): ↑' + (u.in || 0) + ' prompt, ↓' + (u.out || 0) + ' completion',
    };
  }
}
