import ChatIcons from '../../ChatIcons.js';
import Dom from '../../../dom/Dom.js';

export default class VideoControls {
  static SPEEDS = [0.25, 0.5, 1, 1.5, 2];
  static DEFAULT_FPS = 24;

  constructor() {
    this._video = null;
    this._fps = VideoControls.DEFAULT_FPS;
    this._el = VideoControls._build();
    this._wire();
  }

  get element() {
    return this._el;
  }

  attach(video, fps) {
    if (this._video) this._unbind(this._video);
    this._video = video || null;
    this._fps = fps > 0 ? fps : VideoControls.DEFAULT_FPS;
    this._el.hidden = !this._video;
    if (!this._video) return;
    for (const ev of ['play', 'pause', 'timeupdate', 'durationchange', 'loadedmetadata', 'volumechange', 'ratechange']) {
      this._video.addEventListener(ev, this._sync);
    }
    this._sync();
  }

  togglePlay() {
    const v = this._video;
    if (!v) return;
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
  }

  stepFrame(dir) {
    const v = this._video;
    if (!v) return;
    v.pause();
    const t = (v.currentTime || 0) + dir / this._fps;
    v.currentTime = Math.max(0, Math.min(Number.isFinite(v.duration) ? v.duration : t, t));
  }

  static formatTime(sec) {
    const s = Number.isFinite(sec) && sec > 0 ? sec : 0;
    const m = Math.floor(s / 60);
    const r = (s - m * 60).toFixed(1).padStart(4, '0');
    return m + ':' + r;
  }

  _sync = () => {
    const v = this._video;
    if (!v) return;
    const q = (sel) => this._el.querySelector(sel);
    q('.cm-vc-play').innerHTML = v.paused ? ChatIcons.play : ChatIcons.pause;
    q('.cm-vc-play').title = v.paused ? 'Play (Space)' : 'Pause (Space)';
    const dur = Number.isFinite(v.duration) ? v.duration : 0;
    const seek = q('.cm-vc-seek');
    if (!this._scrubbing) seek.value = dur ? String(Math.round((v.currentTime / dur) * 1000)) : '0';
    q('.cm-vc-time').textContent = VideoControls.formatTime(v.currentTime) + ' / ' + VideoControls.formatTime(dur);
    q('.cm-vc-loop').classList.toggle('is-on', !!v.loop);
    q('.cm-vc-loop').setAttribute('aria-pressed', v.loop ? 'true' : 'false');
    q('.cm-vc-mute').innerHTML = v.muted ? ChatIcons.muted : ChatIcons.volume;
    q('.cm-vc-speed').value = String(v.playbackRate || 1);
  };

  _wire() {
    const q = (sel) => this._el.querySelector(sel);
    q('.cm-vc-play').addEventListener('click', () => this.togglePlay());
    q('.cm-vc-back').addEventListener('click', () => this.stepFrame(-1));
    q('.cm-vc-fwd').addEventListener('click', () => this.stepFrame(1));
    q('.cm-vc-loop').addEventListener('click', () => { if (this._video) { this._video.loop = !this._video.loop; this._sync(); } });
    q('.cm-vc-mute').addEventListener('click', () => { if (this._video) this._video.muted = !this._video.muted; });
    q('.cm-vc-speed').addEventListener('change', (e) => { if (this._video) this._video.playbackRate = Number(e.target.value) || 1; });
    const seek = q('.cm-vc-seek');
    seek.addEventListener('input', () => {
      const v = this._video;
      if (!v || !Number.isFinite(v.duration)) return;
      this._scrubbing = true;
      v.currentTime = (Number(seek.value) / 1000) * v.duration;
    });
    seek.addEventListener('change', () => { this._scrubbing = false; this._sync(); });
  }

  _unbind(video) {
    for (const ev of ['play', 'pause', 'timeupdate', 'durationchange', 'loadedmetadata', 'volumechange', 'ratechange']) {
      video.removeEventListener(ev, this._sync);
    }
  }

  static _build() {
    const el = Dom.el('div', 'cm-vc');
    el.hidden = true;
    const speeds = VideoControls.SPEEDS.map((s) => '<option value="' + s + '">' + s + '×</option>').join('');
    el.innerHTML = '<button type="button" class="cm-mv-btn cm-vc-play" aria-label="Play or pause">' + ChatIcons.play + '</button>'
      + '<button type="button" class="cm-mv-btn cm-vc-back" title="Previous frame (,)" aria-label="Previous frame">' + ChatIcons.frameBack + '</button>'
      + '<button type="button" class="cm-mv-btn cm-vc-fwd" title="Next frame (.)" aria-label="Next frame">' + ChatIcons.frameFwd + '</button>'
      + '<input type="range" class="cm-vc-seek" min="0" max="1000" step="1" value="0" aria-label="Seek"/>'
      + '<span class="cm-vc-time">0:00.0 / 0:00.0</span>'
      + '<select class="cm-vc-speed" title="Playback speed" aria-label="Playback speed">' + speeds + '</select>'
      + '<button type="button" class="cm-mv-btn cm-vc-loop" title="Loop" aria-label="Loop" aria-pressed="true">' + ChatIcons.loop + '</button>'
      + '<button type="button" class="cm-mv-btn cm-vc-mute" title="Mute" aria-label="Mute">' + ChatIcons.muted + '</button>';
    return el;
  }
}
