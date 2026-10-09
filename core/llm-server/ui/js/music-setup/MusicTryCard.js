import Dom from '../dom/Dom.js';
import MusicAiAssist from './MusicAiAssist.js';

export default class MusicTryCard {
  static FORM_HTML = `
        <div class="music-gate-note" id="musicTryGate" hidden></div>
        <div id="musicTryForm">
          <div class="defaults-row" style="align-items:start"><label>Lyrics</label>
            <textarea id="musicLyricsInp" rows="6" placeholder="[Verse]&#10;Neon rivers through the midnight town…&#10;&#10;[Chorus]&#10;We're alive, we're alive…"></textarea></div>
          <div class="defaults-row"><label>Style</label>
            <input id="musicStyleInp" placeholder="Warm acoustic pop, female vocals, 95 BPM, gentle guitar and strings"></div>
          <div class="plan-action-row">
            <button class="luma-btn primary luma-btn--sm" id="musicGenBtn">Generate</button>
            <button class="luma-btn luma-btn--sm" id="musicAbortBtn" hidden>Cancel</button>
            <span class="luma-muted" id="musicGenStatus"></span>
          </div>
          <audio id="musicAudioEl" controls style="width:100%;margin-top:8px" hidden></audio>
        </div>
      `;

  constructor(panel) {
    this._panel = panel;
    this._audioUrl = null;
  }

  paint() {
    const body = Dom.byId('musicTryBody');
    if (!body || !this._panel.view) return;
    const runtime = this._panel.runtimeRow();
    const models = (this._panel.view.models && this._panel.view.models.models) || [];
    const ready = !!(runtime && runtime.installed && models.some((m) => m.installed));
    const gen = this._panel.genState;
    const busy = !!(gen && !gen.error && gen.phase !== 'done');
    this._paintPill(busy, ready);
    this._buildOnce(body);
    this._paintGate(ready, runtime);
    this._paintControls(body, ready, busy);
    this._paintStatus(busy, gen);
  }

  async startGeneration() {
    const lyrics = Dom.byId('musicLyricsInp').value.trim();
    const style = Dom.byId('musicStyleInp').value.trim();
    if (!lyrics || !style) {
      const status = Dom.byId('musicGenStatus');
      if (status) status.textContent = 'Both lyrics and a style description are needed.';
      return;
    }
    const requestId = 'try-' + Date.now();
    this._panel.genState = { requestId, phase: 'starting', startedAt: Date.now() };
    this.paint();
    let result;
    try { result = await this._panel.api().gen.generate({ requestId, lyrics, instructions: style }); } catch (e) { result = { success: false, error: (e && e.message) || 'generate failed' }; }
    if (result && result.success && result.audio && result.audio.b64) {
      this._panel.genState = { requestId, phase: 'done' };
      this._play(result.audio);
    } else {
      this._panel.genState = { requestId, phase: 'error', error: (result && result.error) || 'generation failed' };
    }
    this.paint();
    this._panel.refreshStatusOnly();
  }

  _paintPill(busy, ready) {
    const pill = Dom.byId('musicTryPill');
    if (!pill) return;
    pill.className = 'luma-badge ' + (busy ? 'accent' : ready ? 'ok' : '');
    pill.textContent = busy ? 'Generating…' : ready ? 'Ready' : 'Needs setup';
  }

  _buildOnce(body) {
    if (body.dataset.built) return;
    body.dataset.built = '1';
    body.className = '';
    body.innerHTML = MusicTryCard.FORM_HTML;
    Dom.byId('musicGenBtn').addEventListener('click', () => this.startGeneration());
    Dom.byId('musicAbortBtn').addEventListener('click', () => this._panel.api().gen.generateAbort());
    MusicAiAssist.attach(Dom.byId('musicLyricsInp'), Dom.byId('musicStyleInp'), this._panel.chatExt(), this._panel.diagApi());
  }

  _paintGate(ready, runtime) {
    const gate = Dom.byId('musicTryGate');
    if (gate) {
      gate.hidden = ready;
      if (!ready) {
        gate.textContent = runtime && runtime.installed
          ? 'Download a music model above to try it out.'
          : 'Install the SGLang-Omni server and download a model above to try it out.';
      }
    }
    const form = Dom.byId('musicTryForm');
    if (form) form.classList.toggle('music-gated', !ready);
  }

  _paintControls(body, ready, busy) {
    const gen = Dom.byId('musicGenBtn');
    if (gen) gen.disabled = !ready || busy;
    for (const id of ['musicLyricsInp', 'musicStyleInp']) {
      const el = Dom.byId(id);
      if (el) el.disabled = !ready;
    }
    body.querySelectorAll('#musicTryForm .cm-xassist').forEach((b) => { b.disabled = !ready; });
    const abort = Dom.byId('musicAbortBtn');
    if (abort) abort.hidden = !busy;
  }

  _paintStatus(busy, gen) {
    const status = Dom.byId('musicGenStatus');
    if (!status) return;
    status.textContent = MusicTryCard.statusText(busy, gen);
  }

  static statusText(busy, gen) {
    if (busy) {
      const phase = gen.phase === 'starting-server' ? 'Loading model (first run takes several minutes)…'
        : gen.phase === 'switching-model' ? 'Switching model…'
          : 'Composing…';
      return phase + (gen.elapsedMs ? ` ${Math.round(gen.elapsedMs / 1000)}s` : '');
    }
    if (gen && gen.error && gen.error !== 'aborted') return `Failed: ${gen.error}`;
    return '';
  }

  _play(audio) {
    const player = Dom.byId('musicAudioEl');
    if (!player) return;
    if (this._audioUrl) { try { URL.revokeObjectURL(this._audioUrl); } catch (_) {} }
    const bin = atob(audio.b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    this._audioUrl = URL.createObjectURL(new Blob([bytes], { type: audio.mime || 'audio/wav' }));
    player.src = this._audioUrl;
    player.hidden = false;
  }
}
