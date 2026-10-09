import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PromptPreviewPanel {
  constructor(chatApi) {
    this._chatApi = chatApi;
  }

  render(body) {
    const panel = Dom.el('div', 'adv-test',
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'
      + '<div><b>System prompt preview</b><div class="adv-lane-meta">The exact system prompt the LLM receives for a Tools-on chat turn, from your current settings.</div></div>'
      + '<div style="display:flex;align-items:center;gap:14px">'
      + '<label class="adv-field"><input type="checkbox" id="advPromptImg"> Image attached</label>'
      + '<button class="adv-btn" id="advPromptBtn">Show prompt</button></div></div>'
      + '<div class="adv-status" id="advPromptStatus" style="margin-top:8px"></div>'
      + '<div class="adv-prompt-segs" id="advPromptSegs"></div>'
      + '<pre class="adv-prompt-out" id="advPromptOut" hidden></pre>');
    body.appendChild(panel);
    panel.querySelector('#advPromptBtn').addEventListener('click', () => this.show(panel));
    panel.querySelector('#advPromptImg').addEventListener('change', () => {
      if (!panel.querySelector('#advPromptOut').hidden) this.show(panel);
    });
  }

  async show(panel) {
    const api = this._chatApi();
    const parts = PromptPreviewPanel._parts(panel);
    if (!api || !api.previewSystemPrompt) { parts.status.textContent = 'Preview API unavailable.'; return; }
    parts.status.textContent = 'Building…';
    try {
      const r = await api.previewSystemPrompt({ withImages: parts.withImages.checked ? 1 : 0 });
      if (r && r.success && typeof r.prompt === 'string') PromptPreviewPanel._paint(parts, r);
      else PromptPreviewPanel._fail(parts, (r && r.error) || 'unknown');
    } catch (e) {
      PromptPreviewPanel._fail(parts, e && e.message);
    }
  }

  static summary(r) {
    const toolBit = (r.toolCount == null) ? 'all tools enabled' : (r.toolCount + ' tools enabled');
    const extBit = (r.extTools && r.extTools.length) ? ' · ' + r.extTools.length + ' extension tool(s)' : '';
    const tokens = (r.tokensEstimate != null) ? r.tokensEstimate : Math.ceil(Number(r.chars || 0) / 4);
    return '~' + Number(tokens).toLocaleString() + ' tokens · ' + toolBit + extBit;
  }

  static _parts(panel) {
    return {
      status: panel.querySelector('#advPromptStatus'),
      out: panel.querySelector('#advPromptOut'),
      segs: panel.querySelector('#advPromptSegs'),
      withImages: panel.querySelector('#advPromptImg'),
    };
  }

  static _paint(parts, r) {
    parts.out.textContent = r.prompt;
    parts.out.hidden = false;
    parts.status.textContent = PromptPreviewPanel.summary(r);
    parts.segs.innerHTML = (r.segments || []).map((s) =>
      '<span class="adv-pseg ' + (s.present ? 'on' : 'off') + '">'
      + (s.present ? '●' : '○') + ' ' + HtmlEscaper.escape(s.label) + '</span>').join('');
  }

  static _fail(parts, message) {
    parts.out.hidden = true;
    parts.segs.innerHTML = '';
    parts.status.textContent = 'Failed: ' + message;
  }
}
