(function () {
  if (!window.LumaSetupExt) {
    console.error('[chatterbox-voice] LumaSetupExt not present');
    return;
  }

  const CLIP_RATE = 24000;
  const MAX_RECORD_SEC = 30;
  const POLL_MS = 700;

  function makeTransport(host, label) {
    host.innerHTML = '<div class="cv-rec-actions">'
      + '<button type="button" class="luma-btn" data-tp-play disabled>Play</button>'
      + '<button type="button" class="luma-btn" data-tp-stop disabled>Stop</button>'
      + '<span class="cv-rec-timer" data-tp-time>0.0 / 0.0 s</span>'
      + '<span class="cv-rec-hint" data-tp-label>' + esc(label || '') + '</span></div>';
    const play = host.querySelector('[data-tp-play]');
    const stop = host.querySelector('[data-tp-stop]');
    const time = host.querySelector('[data-tp-time]');
    const lab = host.querySelector('[data-tp-label]');
    let audio = null;
    let raf = 0;
    const fmt = () => {
      if (!audio) return;
      const d = Number.isFinite(audio.duration) ? audio.duration : 0;
      time.textContent = audio.currentTime.toFixed(1) + ' / ' + d.toFixed(1) + ' s';
    };
    const tick = () => { fmt(); raf = requestAnimationFrame(tick); };
    const idle = () => { cancelAnimationFrame(raf); play.textContent = 'Play'; fmt(); };
    play.addEventListener('click', () => {
      if (!audio) return;
      if (audio.paused) { audio.play().catch(() => {}); play.textContent = 'Pause'; tick(); }
      else { audio.pause(); idle(); }
    });
    stop.addEventListener('click', () => { if (!audio) return; audio.pause(); audio.currentTime = 0; idle(); });
    return {
      load(src, text) {
        this.unload();
        audio = new Audio(src);
        audio.addEventListener('ended', idle);
        audio.addEventListener('loadedmetadata', fmt);
        play.disabled = false; stop.disabled = false;
        if (text != null) lab.textContent = text;
        fmt();
      },
      setLabel(text) { lab.textContent = text; },
      unload() {
        if (audio) { try { audio.pause(); } catch (_) {} }
        audio = null; idle(); play.disabled = true; stop.disabled = true; time.textContent = '0.0 / 0.0 s';
      },
    };
  }

  function injectCss() {
    if (document.getElementById('cv-css')) return;
    const link = document.createElement('link');
    link.id = 'cv-css';
    link.rel = 'stylesheet';
    link.href = '/llm-ui/ext/chatterbox-voice/setup-ui.css';
    document.head.appendChild(link);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  const mb = (b) => (b >= 1024 * 1024 * 1024 ? (b / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : Math.round(b / (1024 * 1024)) + ' MB');

  async function decodeToClip(arrayBuffer) {
    const ctx = new AudioContext();
    try {
      const audio = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const n = audio.length;
      const mono = new Float32Array(n);
      for (let c = 0; c < audio.numberOfChannels; c++) {
        const d = audio.getChannelData(c);
        for (let i = 0; i < n; i++) mono[i] += d[i] / audio.numberOfChannels;
      }
      return resample(mono, audio.sampleRate, CLIP_RATE);
    } finally { ctx.close().catch(() => {}); }
  }
  function resample(samples, from, to) {
    if (from === to) return samples;
    const ratio = from / to;
    const out = new Float32Array(Math.floor(samples.length / ratio));
    for (let i = 0; i < out.length; i++) {
      const pos = i * ratio; const i0 = Math.floor(pos); const i1 = Math.min(samples.length - 1, i0 + 1); const t = pos - i0;
      out[i] = samples[i0] * (1 - t) + samples[i1] * t;
    }
    return out;
  }
  function encodeWav(samples, rate) {
    const buf = new ArrayBuffer(44 + samples.length * 2);
    const v = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
    str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, samples.length * 2, true);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buf;
  }
  function toBase64(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  function mount(el, api) {
    injectCss();
    el.classList.add('luma-setup');

    let st = null;
    let editing = null;
    let formOpen = false;
    let notice = null;
    let clip = null;
    let pollTimer = null;
    let previewing = null;
    let formTransport = null;
    let cardPlayer = null;

    async function inv(action, payload) {
      const r = await api.invoke(action, payload);
      if (!r || !r.success) throw new Error((r && r.error) || (action + ' failed'));
      return r.result;
    }

    async function refresh(keepForm) {
      try { st = await inv('status'); }
      catch (e) {
        el.innerHTML = '<div class="luma-error">Failed to load voice cloning: ' + esc(e.message) + '</div>';
        return;
      }
      if (!keepForm) render(); else renderEngine();
      schedulePoll();
    }

    function schedulePoll() {
      clearTimeout(pollTimer);
      const busy = st && st.jobs && ((st.jobs.runtime && !st.jobs.runtime.done) || (st.jobs.model && !st.jobs.model.done));
      if (!busy || !el.isConnected) return;
      pollTimer = setTimeout(() => refresh(formOpen), POLL_MS);
    }

    function render() {
      el.innerHTML = '';
      const head = document.createElement('div');
      head.className = 'luma-head';
      head.innerHTML =
        '<div><h2 class="luma-title">Voice cloning</h2>'
        + '<p class="luma-sub">Clone a voice from a short recording and let voice conversations and read-aloud speak with it. '
        + 'Powered by Chatterbox (Resemble AI, MIT) on the audio.cpp engine, fully local. '
        + 'Pick a cloned voice here or under the microphone button in the chat.</p></div>';
      const actions = document.createElement('div');
      actions.className = 'cv-head-actions';
      const add = document.createElement('button');
      add.className = 'luma-btn primary';
      add.textContent = 'Add a voice';
      add.addEventListener('click', () => openForm(null));
      actions.appendChild(add);
      head.appendChild(actions);
      el.appendChild(head);

      const engineHost = document.createElement('div');
      engineHost.className = 'cv-engine-host';
      el.appendChild(engineHost);
      renderEngine();

      if (notice) el.appendChild(renderNotice());
      if (formOpen) el.appendChild(renderForm());

      const list = document.createElement('div');
      list.className = 'luma-list';
      const voices = (st && st.voices) || [];
      if (st && st.turboAvailable) list.appendChild(renderCard({
        id: 'turbo', name: 'Chatterbox Turbo', description: 'Built-in English voice, fixed speaker. Fastest option, no cloning.',
        builtin: true, languageName: 'English',
      }));
      if (!voices.length && !formOpen) {
        const empty = document.createElement('div');
        empty.className = 'luma-empty';
        empty.textContent = st && st.models && st.models.some((m) => m.id === 'chatterbox' && m.installed)
          ? 'No cloned voices yet. Click “Add a voice” and record 10-20 seconds of speech.'
          : 'Install the engine and download the Chatterbox model above, then add a voice.';
        list.appendChild(empty);
      }
      for (const v of voices) list.appendChild(renderCard(v));
      el.appendChild(list);
    }

    function renderEngine() {
      const host = el.querySelector('.cv-engine-host');
      if (!host || !st) return;
      host.innerHTML = '';
      const box = document.createElement('div');
      box.className = 'cv-engine';
      const active = st.activeRuntime;
      const srv = st.server || {};
      const badge = active
        ? '<span class="luma-badge">' + esc(active.id.replace('audiocpp-', 'audio.cpp ')) + (srv.state === 'ready' ? ' · running' : '') + '</span>'
        : '<span class="luma-badge">engine not installed</span>';
      box.innerHTML = '<div class="cv-engine-title">Engine and models ' + badge + '</div>';
      const grid = document.createElement('div');
      grid.className = 'cv-engine-grid';

      const rcol = document.createElement('div');
      rcol.className = 'cv-engine-col';
      rcol.innerHTML = '<div class="cv-sub">audio.cpp engine</div>';
      const rj = st.jobs && st.jobs.runtime;
      for (const r of st.runtimes.filter((x) => x.available)) {
        const row = document.createElement('div');
        row.className = 'cv-row';
        const main = document.createElement('div');
        main.className = 'cv-row-main';
        main.innerHTML = '<div class="cv-row-name">' + esc(r.name)
          + (r.recommended ? ' <span class="luma-chip">recommended</span>' : '')
          + (r.installed ? ' <span class="luma-chip">installed</span>' : '')
          + (active && active.id === r.id ? ' <span class="luma-chip cv-chip-active">in use</span>' : '')
          + '</div><div class="cv-row-desc">' + esc(r.description) + (r.sizeNote ? ' · ' + esc(r.sizeNote) : '')
          + (r.requirementNote ? ' · ' + esc(r.requirementNote) : '') + '</div>';
        row.appendChild(main);
        const busy = rj && !rj.done;
        if (r.installed) {
          if (!(active && active.id === r.id)) {
            const use = document.createElement('button');
            use.className = 'luma-btn'; use.textContent = 'Use';
            use.addEventListener('click', () => run('runtime.prefer', { id: r.id }));
            row.appendChild(use);
          }
          const rm = document.createElement('button');
          rm.className = 'luma-btn danger'; rm.textContent = 'Remove';
          rm.disabled = !!busy;
          rm.addEventListener('click', async () => {
            if (await window.LumaModal.confirm('Remove ' + r.name + '?')) run('runtime.uninstall', { id: r.id });
          });
          row.appendChild(rm);
        } else {
          const ins = document.createElement('button');
          ins.className = 'luma-btn' + (r.recommended ? ' primary' : ''); ins.textContent = 'Install';
          ins.disabled = !!busy;
          ins.addEventListener('click', () => run('runtime.install', { id: r.id }));
          row.appendChild(ins);
        }
        rcol.appendChild(row);
        if (rj && rj.id === r.id && !rj.done) rcol.appendChild(progress(rj, 'Installing'));
        if (rj && rj.id === r.id && rj.done && rj.error) rcol.appendChild(errorLine(rj.error));
      }
      if (!st.runtimes.some((x) => x.available)) {
        rcol.innerHTML += '<div class="luma-empty">No prebuilt audio.cpp package for this platform yet.</div>';
      }
      grid.appendChild(rcol);

      const mcol = document.createElement('div');
      mcol.className = 'cv-engine-col';
      mcol.innerHTML = '<div class="cv-sub">Chatterbox models</div>';
      const mj = st.jobs && st.jobs.model;
      for (const m of st.models) {
        const row = document.createElement('div');
        row.className = 'cv-row';
        const main = document.createElement('div');
        main.className = 'cv-row-main';
        main.innerHTML = '<div class="cv-row-name">' + esc(m.name)
          + (m.installed ? ' <span class="luma-chip">installed</span>' : '')
          + '</div><div class="cv-row-desc">' + esc(m.description) + ' · ' + mb(m.sizeBytes) + ' · ' + esc(m.license) + '</div>';
        row.appendChild(main);
        const busy = mj && !mj.done;
        if (m.installed) {
          const rm = document.createElement('button');
          rm.className = 'luma-btn danger'; rm.textContent = 'Delete';
          rm.disabled = !!busy;
          rm.addEventListener('click', async () => {
            if (await window.LumaModal.confirm('Delete ' + m.name + ' (' + mb(m.sizeBytes) + ')?')) run('model.delete', { id: m.id });
          });
          row.appendChild(rm);
        } else if (mj && mj.id === m.id && !mj.done) {
          const cancel = document.createElement('button');
          cancel.className = 'luma-btn'; cancel.textContent = 'Cancel';
          cancel.addEventListener('click', () => run('model.cancel'));
          row.appendChild(cancel);
        } else {
          const dl = document.createElement('button');
          dl.className = 'luma-btn' + (m.id === 'chatterbox' ? ' primary' : ''); dl.textContent = 'Download';
          dl.disabled = !!busy;
          dl.addEventListener('click', () => run('model.download', { id: m.id }));
          row.appendChild(dl);
        }
        mcol.appendChild(row);
        if (mj && mj.id === m.id && !mj.done) mcol.appendChild(progress(mj, 'Downloading'));
        if (mj && mj.id === m.id && mj.done && mj.error) mcol.appendChild(errorLine(mj.error));
      }
      grid.appendChild(mcol);
      box.appendChild(grid);

      if (active && active.backend === 'cpu') {
        const warn = document.createElement('div');
        warn.className = 'cv-row-desc';
        warn.style.marginTop = '8px';
        warn.textContent = 'CPU build in use: a sentence takes several times longer than it lasts to synthesize. A GPU build (CUDA, Vulkan or Metal) answers in well under a second.';
        box.appendChild(warn);
      }
      host.appendChild(box);
    }

    function progress(job, verb) {
      const wrap = document.createElement('div');
      const pct = job.total ? Math.min(100, Math.round((job.received / job.total) * 100)) : null;
      wrap.innerHTML = '<div class="cv-progress"><div style="width:' + (pct == null ? 100 : pct) + '%"></div></div>'
        + '<div class="cv-progress-label">' + esc(verb) + (job.phase === 'extract' ? ', unpacking' : job.phase === 'verify' ? ', verifying' : '')
        + (pct != null ? ': ' + pct + '% of ' + mb(job.total) : '…')
        + (job.bytesPerSec ? ' · ' + mb(job.bytesPerSec) + '/s' : '') + '</div>';
      return wrap;
    }
    function errorLine(msg) {
      const d = document.createElement('div');
      d.className = 'luma-form-err';
      d.textContent = msg;
      return d;
    }

    async function run(action, payload) {
      notice = null;
      try { await inv(action, payload); }
      catch (e) { notice = { kind: 'warn', title: action.replace('.', ' ') + ' failed', lines: [e.message] }; }
      await refresh(formOpen);
      if (notice) render();
    }

    function renderNotice() {
      const box = document.createElement('div');
      box.className = 'cv-notice' + (notice.kind === 'warn' ? ' warn' : '');
      const body = document.createElement('div');
      body.className = 'cv-notice-body';
      body.innerHTML = '<div class="cv-notice-title">' + esc(notice.title) + '</div>'
        + (notice.lines || []).map((l) => '<div class="cv-notice-line">' + esc(l) + '</div>').join('');
      const close = document.createElement('button');
      close.className = 'luma-btn'; close.textContent = 'Dismiss';
      close.addEventListener('click', () => { notice = null; render(); });
      box.appendChild(body); box.appendChild(close);
      return box;
    }

    function renderCard(v) {
      const card = document.createElement('div');
      card.className = 'luma-card luma-card--center';
      const active = st && st.activeVoiceId === v.id;
      card.innerHTML =
        '<div class="luma-card-main">'
        + '<div class="luma-card-name">' + esc(v.name) + '</div>'
        + '<div class="luma-card-desc">' + esc(v.description || (v.builtin ? '' : 'No description')) + '</div>'
        + '<div class="cv-card-meta">'
        + '<span class="luma-chip">' + (v.builtin ? 'Built-in' : 'Cloned') + '</span>'
        + '<span class="luma-chip">' + esc(v.languageName || v.language || 'en') + '</span>'
        + (v.refSec ? '<span class="luma-chip">' + esc(v.refSec) + ' s clip</span>' : '')
        + (v.refHz ? '<span class="luma-chip" title="Median pitch of the reference clip">~' + esc(v.refHz) + ' Hz</span>' : '')
        + (active ? '<span class="luma-chip cv-chip-active">Active in chat</span>' : '')
        + '</div></div>';
      const actions = document.createElement('div');
      actions.className = 'luma-card-actions';
      if (!v.builtin) {
        const playing = cardPlayer && cardPlayer.id === v.id;
        const pc = document.createElement('button');
        pc.className = 'luma-btn'; pc.textContent = playing ? 'Stop clip' : 'Play clip';
        pc.title = 'Hear the reference recording this voice was cloned from';
        pc.addEventListener('click', () => playClip(v));
        actions.appendChild(pc);
      }
      const prev = document.createElement('button');
      prev.className = 'luma-btn'; prev.textContent = previewing === v.id ? 'Synthesizing…' : 'Preview';
      prev.disabled = !!previewing;
      prev.addEventListener('click', () => preview(v));
      const use = document.createElement('button');
      use.className = 'luma-btn' + (active ? '' : ' primary'); use.textContent = active ? 'In use' : 'Use in chat';
      use.disabled = active;
      use.addEventListener('click', () => run('voices.use', { id: v.id }));
      actions.appendChild(prev); actions.appendChild(use);
      if (!v.builtin) {
        const edit = document.createElement('button');
        edit.className = 'luma-btn'; edit.textContent = 'Edit';
        edit.addEventListener('click', () => openForm(v));
        const del = document.createElement('button');
        del.className = 'luma-btn danger'; del.textContent = 'Delete';
        del.addEventListener('click', async () => {
          if (await window.LumaModal.confirm('Delete voice "' + v.name + '"?')) run('voices.delete', { id: v.id });
        });
        actions.appendChild(edit); actions.appendChild(del);
      }
      card.appendChild(actions);
      return card;
    }

    async function playClip(v) {
      if (cardPlayer && cardPlayer.id === v.id) {
        try { cardPlayer.audio.pause(); } catch (_) {}
        cardPlayer = null; render(); return;
      }
      if (cardPlayer) { try { cardPlayer.audio.pause(); } catch (_) {} cardPlayer = null; }
      try {
        const r = await inv('voices.clip', { id: v.id });
        const audio = new Audio('data:audio/wav;base64,' + r.wavBase64);
        cardPlayer = { id: v.id, audio };
        audio.addEventListener('ended', () => { if (cardPlayer && cardPlayer.audio === audio) { cardPlayer = null; render(); } });
        audio.play().catch(() => {});
        render();
      } catch (e) {
        notice = { kind: 'warn', title: 'Could not play the clip', lines: [e.message] };
        render();
      }
    }

    async function preview(v) {
      if (previewing) return;
      previewing = v.id;
      notice = null;
      render();
      try {
        const r = await inv('voices.preview', { id: v.id });
        const audio = new Audio('data:audio/wav;base64,' + r.wavBase64);
        audio.play().catch(() => {});
        const lines = [r.seconds.toFixed(1) + ' s of audio in ' + (r.ms / 1000).toFixed(1) + ' s' + (r.ms > 1500 ? ' (the first run loads the model)' : '')];
        if (r.hz && r.refHz) {
          const ratio = r.hz / r.refHz;
          lines.push('Pitch: preview ~' + r.hz + ' Hz, your clip ~' + r.refHz + ' Hz'
            + (ratio > 1.15 ? '. The clone is noticeably higher: re-record with the microphone in this form (raw capture, no noise suppression), or check that the uploaded file was not sped up.'
              : ratio < 0.87 ? '. The clone is noticeably lower than the clip.' : ' (matching).'));
        }
        notice = { kind: 'ok', title: 'Preview of "' + v.name + '"', lines };
      } catch (e) {
        notice = { kind: 'warn', title: 'Preview failed', lines: [e.message] };
      } finally {
        previewing = null;
        render();
      }
    }

    function openForm(v) {
      editing = v || null;
      formOpen = true;
      clip = null;
      render();
    }
    function closeForm() {
      stopRecording();
      if (formTransport) { formTransport.unload(); formTransport = null; }
      editing = null; formOpen = false; clip = null; render();
    }

    function renderForm() {
      const form = document.createElement('form');
      form.className = 'luma-form';
      const cur = editing || { name: '', description: '', language: 'en', referenceText: '' };
      const langs = (st && st.languages) || [{ code: 'en', name: 'English' }];
      const limits = (st && st.limits) || { minRefSec: 3, maxRefSec: 40 };
      form.innerHTML =
        '<h3 class="luma-form-title">' + (editing ? 'Edit voice' : 'New voice') + '</h3>'
        + '<label class="luma-field"><span>Name</span>'
        + '<input name="name" type="text" value="' + esc(cur.name) + '" placeholder="My voice" /></label>'
        + '<label class="luma-field"><span>Description</span>'
        + '<input name="description" type="text" value="' + esc(cur.description) + '" placeholder="Warm, slow, slightly raspy" /></label>'
        + '<label class="luma-field"><span>Language of the clip <small>(Chatterbox speaks 18)</small></span>'
        + '<select name="language">' + langs.map((l) => '<option value="' + esc(l.code) + '"' + (cur.language === l.code ? ' selected' : '') + '>' + esc(l.name) + '</option>').join('') + '</select></label>'
        + '<div class="luma-field"><span>Reference clip <small>(' + limits.minRefSec + '-' + limits.maxRefSec + ' seconds of one person talking; 10-20 is best'
        + (editing ? '; leave empty to keep the current clip' : '') + ')</small></span>'
        + '<div class="cv-rec luma-scrollbox">'
        + '<div class="cv-rec-actions">'
        + '<button type="button" class="luma-btn" data-rec>Record from microphone</button>'
        + '<span class="cv-rec-timer">0.0 s</span>'
        + '<label class="luma-btn" style="cursor:pointer">Choose audio file…<input type="file" accept="audio/*,.wav,.mp3,.m4a,.ogg,.flac" style="display:none" data-file></label>'
        + '</div>'
        + '<div class="cv-rec-level"><div></div></div>'
        + '<div class="cv-rec-hint">Read a few natural sentences at a normal pace in a quiet room, close to the microphone. '
        + 'Recording here is raw (no noise suppression or auto-gain, which thin a voice and push it up in pitch). '
        + 'Chatterbox listens to the first 10 seconds or so, so put the most typical speech first.</div>'
        + '<div class="cv-rec-transport"></div>'
        + '<div class="cv-rec-preview"></div>'
        + '<label class="cv-rec-actions" style="margin-top:4px"><span class="cv-rec-hint">Skip the first</span>'
        + '<input name="trimStartSec" type="number" min="0" max="30" step="0.5" value="0" style="width:5em" />'
        + '<span class="cv-rec-hint">seconds (cut a false start; use Play to find the spot)</span></label>'
        + '</div></div>'
        + '<div class="luma-field"><span>What the clip says <small>(optional; helps pronunciation)</small></span>'
        + '<textarea name="referenceText" rows="2" placeholder="Transcript of the reference clip">' + esc(cur.referenceText) + '</textarea>'
        + '<div class="cv-rec-actions" style="margin-top:6px">'
        + '<button type="button" class="luma-btn" data-transcribe' + (st && st.sttReady ? '' : ' disabled') + '>Transcribe automatically</button>'
        + '<span class="cv-rec-hint" data-transcribe-note>' + (st && st.sttReady
          ? 'Uses the speech recognition you set up for voice chat.'
          : 'Set up speech recognition first (click the microphone in the chat once).') + '</span>'
        + '</div></div>'
        + (editing ? '' : '<label class="luma-field" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="makeDefault" checked /> <span>Use this voice in chat right away</span></label>')
        + '<div class="luma-form-err"></div>'
        + '<div class="luma-form-actions">'
        + '<button type="button" class="luma-btn" data-cancel>Cancel</button>'
        + '<button type="submit" class="luma-btn primary">' + (editing ? 'Save' : 'Create voice') + '</button>'
        + '</div>';

      form.querySelector('[data-cancel]').addEventListener('click', closeForm);
      form.querySelector('[data-rec]').addEventListener('click', () => toggleRecording(form));
      form.querySelector('[data-file]').addEventListener('change', (e) => loadFile(form, e.target.files && e.target.files[0]));
      form.querySelector('[data-transcribe]').addEventListener('click', () => transcribeClip(form));
      form.addEventListener('submit', (e) => { e.preventDefault(); saveForm(form); });
      formTransport = makeTransport(form.querySelector('.cv-rec-transport'), editing ? 'Loading the saved clip…' : 'No clip yet.');
      if (editing) {
        inv('voices.clip', { id: editing.id })
          .then((r) => { if (formTransport && form.isConnected) formTransport.load('data:audio/wav;base64,' + r.wavBase64, 'Saved clip: ' + r.seconds + ' s' + (r.hz ? ', ~' + r.hz + ' Hz' : '')); })
          .catch((e) => { if (formTransport) formTransport.setLabel('Saved clip unavailable: ' + e.message); });
      }
      return form;
    }

    async function transcribeClip(form) {
      const btn = form.querySelector('[data-transcribe]');
      const note = form.querySelector('[data-transcribe-note]');
      const field = form.querySelector('[name=referenceText]');
      const err = form.querySelector('.luma-form-err');
      err.textContent = '';
      stopRecording(form);
      if (!clip && !editing) { err.textContent = 'Record a reference clip or choose an audio file first.'; return; }
      const payload = { language: form.querySelector('[name=language]').value };
      if (clip) payload.audioBase64 = toBase64(clip.wav); else payload.id = editing.id;
      btn.disabled = true;
      note.textContent = 'Transcribing… (the first run loads the recognizer)';
      try {
        const r = await inv('voices.transcribe', payload);
        if (!r.text) { note.textContent = 'Nothing recognized. Is the clip speech?'; return; }
        field.value = r.text;
        note.textContent = 'Transcribed in ' + (r.durationMs / 1000).toFixed(1) + ' s. Fix anything the recognizer got wrong.';
      } catch (e) {
        err.textContent = e.message;
        note.textContent = '';
      } finally {
        btn.disabled = false;
      }
    }

    let rec = null;
    function toggleRecording(form) {
      if (rec) stopRecording(form); else startRecording(form);
    }
    async function startRecording(form) {
      const err = form.querySelector('.luma-form-err');
      err.textContent = '';
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        });
      } catch (e) { err.textContent = 'Microphone unavailable: ' + e.message; return; }
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const buffers = [];
      proc.onaudioprocess = (e) => { if (rec) buffers.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
      const sink = ctx.createGain();
      sink.gain.value = 0;
      source.connect(analyser);
      source.connect(proc);
      proc.connect(sink);
      sink.connect(ctx.destination);
      const data = new Float32Array(analyser.fftSize);
      rec = { stream, ctx, source, proc, sink, buffers, rate: ctx.sampleRate, startedAt: Date.now(), analyser, raf: 0 };
      const btn = form.querySelector('[data-rec]');
      btn.textContent = 'Stop recording';
      const timerEl = form.querySelector('.cv-rec-timer');
      timerEl.classList.add('live');
      const level = form.querySelector('.cv-rec-level > div');
      const tick = () => {
        if (!rec) return;
        const sec = (Date.now() - rec.startedAt) / 1000;
        timerEl.textContent = sec.toFixed(1) + ' s';
        analyser.getFloatTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        if (level) level.style.width = Math.min(100, Math.round(Math.sqrt(sum / data.length) * 700)) + '%';
        if (sec >= MAX_RECORD_SEC) { stopRecording(form); return; }
        rec.raf = requestAnimationFrame(tick);
      };
      tick();
    }
    function stopRecording(form) {
      if (!rec) return;
      const r = rec;
      rec = null;
      cancelAnimationFrame(r.raf);
      try { r.proc.disconnect(); r.source.disconnect(); r.sink.disconnect(); } catch (_) {}
      try { r.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      try { r.ctx.close(); } catch (_) {}
      if (form && r.buffers.length) {
        const total = r.buffers.reduce((n, b) => n + b.length, 0);
        const all = new Float32Array(total);
        let off = 0;
        for (const b of r.buffers) { all.set(b, off); off += b.length; }
        setClipSamples(form, resample(all, r.rate, CLIP_RATE)).catch((e) => {
          const err = form.querySelector('.luma-form-err');
          if (err) err.textContent = 'Could not keep the recording: ' + e.message;
        });
      }
      if (form) {
        const btn = form.querySelector('[data-rec]');
        if (btn) btn.textContent = 'Record again';
        const timerEl = form.querySelector('.cv-rec-timer');
        if (timerEl) timerEl.classList.remove('live');
        const level = form.querySelector('.cv-rec-level > div');
        if (level) level.style.width = '0';
      }
    }
    async function loadFile(form, file) {
      if (!file) return;
      const err = form.querySelector('.luma-form-err');
      err.textContent = '';
      try { await setClip(form, await file.arrayBuffer()); }
      catch (e) { err.textContent = 'Could not decode that file: ' + e.message; }
    }
    async function setClip(form, arrayBuffer) {
      return setClipSamples(form, await decodeToClip(arrayBuffer));
    }
    async function setClipSamples(form, samples) {
      const limits = (st && st.limits) || { maxRefSec: 40 };
      const trimmed = samples.length > limits.maxRefSec * CLIP_RATE ? samples.subarray(0, limits.maxRefSec * CLIP_RATE) : samples;
      const wav = encodeWav(trimmed, CLIP_RATE);
      if (clip && clip.url) URL.revokeObjectURL(clip.url);
      clip = { wav, seconds: trimmed.length / CLIP_RATE, url: URL.createObjectURL(new Blob([wav], { type: 'audio/wav' })), analysis: null };
      const label = 'New clip: ' + clip.seconds.toFixed(1) + ' s' + (samples.length !== trimmed.length ? ' (trimmed to ' + limits.maxRefSec + ' s)' : '');
      if (formTransport) formTransport.load(clip.url, label);
      const timerEl = form.querySelector('[data-rec] ~ .cv-rec-timer, .cv-rec-timer');
      if (timerEl) timerEl.textContent = clip.seconds.toFixed(1) + ' s';
      const prev = form.querySelector('.cv-rec-preview');
      if (prev) prev.innerHTML = '<div class="cv-rec-hint">Measuring the clip…</div>';
      try {
        const a = await inv('voices.analyze', { audioBase64: toBase64(wav) });
        clip.analysis = a;
        if (prev && form.isConnected) {
          prev.innerHTML = '<div class="cv-rec-hint">Clip: ' + a.seconds + ' s, pitch ~' + (a.medianHz || '?') + ' Hz, level ' + a.rmsDb + ' dBFS'
            + (a.rmsDb < -32 ? ' (quiet: it will be normalized, but move closer to the microphone for a cleaner clone)' : '')
            + (a.medianHz === 0 ? ' (no voiced speech detected)' : '') + '</div>';
        }
      } catch (_) {
        if (prev) prev.innerHTML = '';
      }
    }

    async function saveForm(form) {
      stopRecording(form);
      const errBox = form.querySelector('.luma-form-err');
      errBox.textContent = '';
      const name = form.querySelector('[name=name]').value.trim();
      const description = form.querySelector('[name=description]').value.trim();
      const language = form.querySelector('[name=language]').value;
      const referenceText = form.querySelector('[name=referenceText]').value.trim();
      const makeDefaultEl = form.querySelector('[name=makeDefault]');
      const trimStartSec = Number(form.querySelector('[name=trimStartSec]').value) || 0;
      if (!name) { errBox.textContent = 'Name is required.'; return; }
      if (!editing && !clip) { errBox.textContent = 'Record a reference clip or choose an audio file.'; return; }
      const payload = { name, description, language, referenceText };
      if (clip) { payload.audioBase64 = toBase64(clip.wav); payload.trimStartSec = trimStartSec; }
      const submit = form.querySelector('[type=submit]');
      submit.disabled = true;
      submit.textContent = 'Saving…';
      try {
        if (editing) await inv('voices.update', { id: editing.id, patch: payload, audioBase64: payload.audioBase64 });
        else await inv('voices.create', { ...payload, makeDefault: !!(makeDefaultEl && makeDefaultEl.checked) });
        notice = { kind: 'ok', title: (editing ? 'Saved' : 'Created') + ' voice "' + name + '"', lines: editing ? [] : ['Click Preview to hear it. The first preview loads the model.'] };
        closeForm();
        await refresh();
      } catch (e) {
        errBox.textContent = e.message;
        submit.disabled = false;
        submit.textContent = editing ? 'Save' : 'Create voice';
      }
    }

    refresh();
  }

  window.LumaSetupExt.registerTab({ id: 'chatterbox-voice', label: 'Voice cloning', mount });
})();
