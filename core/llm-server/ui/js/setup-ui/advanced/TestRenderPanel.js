import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import TestRenderTables from './TestRenderTables.js';

export default class TestRenderPanel {
  static RESULT_IDS = ['advTestRow', 'advTestVram', 'advTestPlacement'];

  constructor(view) {
    this._view = view;
    this._unsubscribe = null;
    this._lastResults = null;
  }

  render(body) {
    const panel = Dom.el('div', 'adv-test',
      '<div style="display:flex;justify-content:space-between;align-items:center">'
      + '<div><b>Test render</b><div class="adv-lane-meta">Ask the LLM for a cat, then to add a funny hat: measures real time and records each model’s peak VRAM/RAM (required before allocation).</div></div>'
      + '<button class="adv-btn" id="advTest">Run test</button></div>'
      + '<div class="adv-status" id="advTestStatus" style="margin-top:8px"></div>'
      + '<div class="adv-test-row" id="advTestRow"></div>'
      + '<div id="advTestVram"></div>'
      + '<div id="advTestPlacement"></div>');
    body.appendChild(panel);
    panel.querySelector('#advTest').addEventListener('click', () => this.run(panel));
    if (this._lastResults) this._restore(panel, this._lastResults);
  }

  async run(panel) {
    const api = this._view.placementApi();
    if (!api) return;
    const btn = panel.querySelector('#advTest');
    const status = panel.querySelector('#advTestStatus');
    btn.disabled = true;
    panel.querySelector('#advTestRow').innerHTML = '';
    this._lastResults = null;
    status.textContent = 'Starting…';
    this._follow(api, status);
    try {
      await this._runAndShow(api, panel, status);
    } catch (e) { status.textContent = 'Test failed: ' + (e && e.message); } finally {
      btn.disabled = false;
      this._stopFollowing();
    }
  }

  static statusText(evt) {
    const p = evt.payload;
    if (evt.type === 'status') return (p && p.label ? p.label + ': ' : '') + (p && p.phase || '…');
    if (evt.type === 'step') {
      return p.label + ' ' + (p.ok ? 'done' : 'failed') + ' in ' + (p.ms / 1000).toFixed(1) + 's'
        + (p.ok ? '' : ': ' + (p.error || 'no image'));
    }
    return null;
  }

  async _runAndShow(api, panel, status) {
    const r = await api.runTest();
    if (!(r && r.success)) { status.textContent = 'Test failed: ' + ((r && r.error) || 'unknown'); return; }
    status.textContent = 'Total: ' + (r.totalMs / 1000).toFixed(1) + 's';
    await this._showResults(panel, r);
    await this._refreshGate(api);
  }

  async _refreshGate(api) {
    try {
      const cfg = await api.getConfig();
      if (cfg && cfg.config) {
        this._view.model.applyConfig(cfg.config);
        this._view.render();
      }
    } catch (_) {}
  }

  _follow(api, status) {
    this._stopFollowing();
    this._unsubscribe = api.onTestEvent((evt) => {
      if (!evt) return;
      const text = TestRenderPanel.statusText(evt);
      if (text != null) status.textContent = text;
    });
  }

  _stopFollowing() {
    if (!this._unsubscribe) return;
    try { this._unsubscribe(); } catch (_) {}
    this._unsubscribe = null;
  }

  async _showResults(panel, r) {
    const row = panel.querySelector('#advTestRow');
    for (const step of (r.steps || [])) row.appendChild(await this._stepCard(step));
    const isAvailable = (key) => this._view.model.itemAvailable(key);
    panel.querySelector('#advTestVram').innerHTML = TestRenderTables.vramHtml(r.vram, isAvailable);
    panel.querySelector('#advTestPlacement').innerHTML = TestRenderTables.placementHtml(r.placement, isAvailable);
    this._lastResults = TestRenderPanel._capture(panel);
  }

  static _capture(panel) {
    const html = {};
    for (const id of TestRenderPanel.RESULT_IDS) html[id] = panel.querySelector('#' + id).innerHTML;
    html.advTestStatus = panel.querySelector('#advTestStatus').textContent;
    return html;
  }

  _restore(panel, html) {
    for (const id of TestRenderPanel.RESULT_IDS) panel.querySelector('#' + id).innerHTML = html[id];
    panel.querySelector('#advTestStatus').textContent = html.advTestStatus;
  }

  async _stepCard(step) {
    const esc = HtmlEscaper.escape;
    const detail = step.ok ? '' : (step.error ? ': ' + esc(step.error) : ' (no image)');
    return Dom.el('div', 'adv-test-card', (await this._imageHtml(step)) + '<div class="t"><b>' + esc(step.label) + '</b> · '
      + (step.ms / 1000).toFixed(1) + 's' + detail + '</div>' + TestRenderTables.timingHtml(step.timing));
  }

  async _imageHtml(step) {
    const artifacts = this._view.artifactApi();
    if (!step.artifactId || !artifacts || !artifacts.get) return '';
    try {
      const ar = await artifacts.get(step.artifactId);
      const art = ar && ar.artifact;
      if (art && art.content) return '<img alt="" src="data:' + (art.language || 'image/png') + ';base64,' + art.content + '">';
    } catch (_) {}
    return '';
  }
}
