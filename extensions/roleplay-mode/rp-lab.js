(function () {
  'use strict';

  if (!window.LumaSetupExt) { console.error('[roleplay-lab] LumaSetupExt not present'); return; }

  const api = () => (window.llmDiagAPI && window.llmDiagAPI.rpLab) || null;
  const PARAMS = [
    { key: 'steps', type: 'number', min: 1, max: 100, step: 1 },
    { key: 'sampler', type: 'select', options: ['', 'euler', 'euler_a', 'dpm++2m', 'dpm++2mv2', 'heun', 'lcm'] },
    { key: 'scheduler', type: 'select', options: ['', 'discrete', 'karras', 'beta', 'exponential', 'sgm_uniform'] },
    { key: 'strength', type: 'number', min: 0, max: 1, step: 0.05 },
    { key: 'cfgScale', type: 'number', min: 0, max: 20, step: 0.5 },
    { key: 'seed', type: 'number', min: -1, max: 4294967295, step: 1 },
  ];

  const FALLBACK_PROFILES = {
    fast: {
      id: 'fast', editSteps: 4, figureSteps: 4, outfitSteps: 4, emotionSteps: 4,
      harmonize: false, harmonizeStrength: 0, auditLimit: 1,
      resolutions: {
        portrait: { width: 448, height: 448 }, scene: { width: 640, height: 448 },
        composite: { width: 768, height: 1152 }, reaction: { width: 640, height: 896 },
        reactionFull: { width: 672, height: 960 },
      },
    },
    balanced: {
      id: 'balanced', editSteps: 6, figureSteps: 4, outfitSteps: 6, emotionSteps: 6,
      harmonize: false, harmonizeStrength: 0, auditLimit: 1,
      resolutions: {
        portrait: { width: 512, height: 512 }, scene: { width: 768, height: 512 },
        composite: { width: 768, height: 1152 }, reaction: { width: 768, height: 1024 },
        reactionFull: { width: 832, height: 1216 },
      },
    },
    quality: {
      id: 'quality', editSteps: 8, figureSteps: 6, outfitSteps: 8, emotionSteps: 8,
      harmonize: true, harmonizeStrength: 0.07, auditLimit: 2,
      resolutions: {
        portrait: { width: 512, height: 512 }, scene: { width: 896, height: 640 },
        composite: { width: 768, height: 1152 }, reaction: { width: 768, height: 1024 },
        reactionFull: { width: 832, height: 1216 },
      },
    },
  };
  const RES_TYPES = [
    { key: 'portrait', label: 'Portrait', hint: 'face + emotion edits' },
    { key: 'scene', label: 'Scene', hint: 'empty establishing art' },
    { key: 'composite', label: 'Figure', hint: 'outfit + posed body' },
    { key: 'reaction', label: 'Reaction', hint: 'portrait final image' },
    { key: 'reactionFull', label: 'Full reaction', hint: 'full-body final image' },
  ];
  const copyResolutions = (profile) => JSON.parse(JSON.stringify((profile && profile.resolutions) || {}));

  let S = {
    scenario: null,
    profiles: FALLBACK_PROFILES,
    imageProfile: 'balanced',
    steps: [],
    overrides: {},
    emotion: 'neutral',
    resolutions: copyResolutions(FALLBACK_PROFILES.balanced),
    autoImage: true,
    sceneBackground: true,
    autoAvatarArt: false,
    artAudit: true,
    integratedCompare: true,
    harmonizeMode: 'auto',
    harmonizeStrength: 0,
    running: false,
    unsub: null,
  };

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function thumb(b64, label) {
    const t = el('span', 'rpl-thumb');
    t.title = label;
    t.innerHTML = '<img alt="" src="data:image/png;base64,' + b64 + '"><span>' + esc(label) + '</span>';
    return t;
  }

  function injectStyles() {
    if (document.getElementById('rplab-styles')) return;
    const css = `
    #rpLabRoot { max-width: 1100px; }
    .rpl-status { color:#8a95ad; font-size:12px; margin:8px 2px; min-height:16px; }
    .rpl-ctrls { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin:4px 2px; }
    .rpl-ctrl { font-size:12px; color:#c4cad8; display:inline-flex; align-items:center; gap:6px; }
    .rpl-ctrl select { background:#0f131b; border:1px solid rgba(255,255,255,0.14); color:#e6e9f2; border-radius:5px; padding:4px 6px; font-size:12px; }
    .rpl-ctrl-hint { color:#6b7488; font-size:11px; }
    .rpl-console { margin:10px 2px 4px; padding:12px; border:1px solid rgba(124,156,255,0.2); border-radius:10px;
      background:linear-gradient(135deg,rgba(31,40,61,.92),rgba(13,17,25,.96)); box-shadow:inset 3px 0 #7896ff; }
    .rpl-console-head { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:10px; }
    .rpl-console-title { color:#eef2ff; font-size:12px; font-weight:650; letter-spacing:.04em; text-transform:uppercase; }
    .rpl-console-copy { color:#78839a; font-size:10px; margin-top:2px; }
    .rpl-profile-rail { display:grid; grid-template-columns:repeat(3,minmax(145px,1fr)); gap:7px; }
    .rpl-profile { text-align:left; border:1px solid rgba(255,255,255,.11); border-radius:8px; padding:8px 9px;
      background:#101520; color:#b8c0d2; cursor:pointer; transition:border-color .12s,transform .12s,background .12s; }
    .rpl-profile:hover { transform:translateY(-1px); border-color:rgba(120,150,255,.52); }
    .rpl-profile.active { border-color:#7896ff; background:#17213a; box-shadow:0 0 0 1px rgba(120,150,255,.22); }
    .rpl-profile strong { display:block; color:#edf1ff; font-size:12px; }
    .rpl-profile span { display:block; color:#7d879c; font-size:10px; line-height:1.35; margin-top:2px; }
    .rpl-recipe { display:flex; flex-wrap:wrap; gap:6px; margin-top:9px; }
    .rpl-chip { border:1px solid rgba(255,255,255,.1); border-radius:999px; background:rgba(6,9,15,.48);
      color:#9da8be; font:10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace; padding:4px 7px; }
    .rpl-switches { display:flex; flex-wrap:wrap; gap:7px 14px; margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.07); }
    .rpl-switch { display:inline-flex; gap:6px; align-items:center; color:#bec6d7; font-size:11px; }
    .rpl-switch input { accent-color:#7896ff; }
    .rpl-switch select,.rpl-switch input[type=number] { background:#0f131b; border:1px solid rgba(255,255,255,.14);
      color:#e6e9f2; border-radius:5px; padding:3px 5px; font-size:11px; }
    .rpl-switch input[type=number] { width:54px; }
    .rpl-res { display:flex; align-items:flex-start; gap:14px; flex-wrap:wrap; margin:4px 2px 2px; padding:8px 10px;
      border:1px solid rgba(255,255,255,0.08); border-radius:8px; background:#10141d; }
    .rpl-res-title { color:#8a95ad; font-size:12px; align-self:center; }
    .rpl-res-grp { display:flex; flex-direction:column; gap:2px; }
    .rpl-res-grp .lab { font-size:11px; color:#c4cad8; }
    .rpl-res-grp .hint { font-size:10px; color:#6b7488; }
    .rpl-res-grp .rpl-res-wh { display:inline-flex; align-items:center; gap:4px; }
    .rpl-res-grp input { width:58px; background:#0f131b; border:1px solid rgba(255,255,255,0.14); color:#e6e9f2;
      border-radius:5px; padding:4px 5px; font-size:12px; }
    .rpl-res-grp input.changed { border-color:#f59034; }
    .rpl-res-grp .x { color:#6b7488; font-size:11px; }
    .rpl-step { border:1px solid rgba(255,255,255,0.10); border-radius:12px; padding:14px; margin:12px 0; background:#12161f; }
    .rpl-step-head { display:flex; justify-content:space-between; align-items:center; gap:12px; }
    .rpl-step-title { font-weight:600; font-size:15px; }
    .rpl-step-title .seq { color:#6b7488; margin-right:6px; }
    .rpl-step-title .replay { color:#f59e0b; font-size:11px; margin-left:8px; }
    .rpl-row { display:flex; gap:16px; flex-wrap:wrap; margin-top:10px; }
    .rpl-img { flex:0 0 auto; }
    .rpl-img img { max-width:360px; max-height:360px; border-radius:8px; border:1px solid rgba(255,255,255,0.12); display:block; }
    .rpl-img .noimg { color:#e0556b; font-size:12px; }
    .rpl-compare { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:10px; }
    .rpl-compare figure { margin:0; min-width:0; }
    .rpl-compare figcaption { color:#aeb8cd; font-size:11px; margin-bottom:6px; }
    .rpl-compare img { width:100%; max-height:560px; object-fit:contain; background:#090c12;
      border-radius:8px; border:1px solid rgba(255,255,255,.12); display:block; }
    .rpl-compare .noimg { min-height:180px; display:grid; place-items:center; color:#e0556b;
      border:1px dashed rgba(255,255,255,.14); border-radius:8px; }
    .rpl-side { flex:1; min-width:280px; }
    .rpl-prompt { width:100%; box-sizing:border-box; background:#0f131b; border:1px solid rgba(255,255,255,0.14);
      color:#c4cad8; border-radius:6px; padding:8px; font:12px/1.4 monospace; min-height:60px; resize:vertical; }
    .rpl-prompt.changed { border-color:#f59034; }
    .rpl-inputs { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:2px 0 8px; }
    .rpl-inputs-label { color:#6b7488; font-size:11px; }
    .rpl-thumb { display:inline-flex; flex-direction:column; align-items:center; gap:2px; }
    .rpl-thumb img { width:54px; height:54px; object-fit:cover; border-radius:5px; border:1px solid rgba(255,255,255,0.16); }
    .rpl-thumb span { font-size:9px; color:#6b7488; }
    .rpl-params { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; margin-top:10px; }
    .rpl-field { display:flex; flex-direction:column; gap:3px; font-size:11px; color:#8a95ad; }
    .rpl-field input, .rpl-field select { background:#0f131b; border:1px solid rgba(255,255,255,0.14); color:#e6e9f2;
      border-radius:5px; padding:5px 6px; font-size:12px; }
    .rpl-field.changed input, .rpl-field.changed select { border-color:#f59034; }
    .rpl-step-actions { margin-top:10px; display:flex; gap:8px; align-items:center; }
    .adv-btn.sm { padding:6px 10px; font-size:12px; }
    .rpl-meta { color:#6b7488; font-size:11px; margin-top:6px; }
    .rpl-scn { color:#8a95ad; font-size:12px; margin:6px 2px 12px; }
    @media (max-width:720px) { .rpl-profile-rail,.rpl-compare { grid-template-columns:1fr; } .rpl-console-head { flex-direction:column; } }
    `;
    const s = el('style'); s.id = 'rplab-styles'; s.textContent = css;
    document.head.appendChild(s);
  }

  function status(t) { const s = document.getElementById('rpLabStatus'); if (s) s.textContent = t || ''; }

  function selectedProfile() {
    return S.profiles[S.imageProfile] || S.profiles.balanced || FALLBACK_PROFILES.balanced;
  }

  function effectiveHarmonize() {
    if (S.harmonizeMode === 'on') return true;
    if (S.harmonizeMode === 'off') return false;
    return !!selectedProfile().harmonize;
  }

  function runOptions() {
    return {
      emotion: S.emotion,
      imageProfile: S.imageProfile,
      resolutions: S.resolutions,
      autoImage: S.autoImage,
      sceneBackground: S.sceneBackground,
      autoAvatarArt: S.autoAvatarArt,
      artAudit: S.artAudit,
      integratedCompare: S.integratedCompare,
      harmonizeMode: S.harmonizeMode,
      harmonize: effectiveHarmonize(),
      harmonizeStrength: effectiveHarmonize() ? Number(S.harmonizeStrength) || 0.07 : 0,
    };
  }

  function loadScenarioControls() {
    const o = S.scenario && S.scenario.options || {};
    S.imageProfile = S.profiles[o.imageProfile] ? o.imageProfile : 'balanced';
    const profile = selectedProfile();
    S.resolutions = copyResolutions(profile);
    for (const type of RES_TYPES) {
      const saved = o.resolutions && o.resolutions[type.key];
      if (saved && Number(saved.width) > 0 && Number(saved.height) > 0) {
        S.resolutions[type.key] = { width: Number(saved.width), height: Number(saved.height) };
      }
    }
    S.autoImage = o.autoImage !== false;
    S.sceneBackground = o.sceneBackground !== false;
    S.autoAvatarArt = o.autoAvatarArt === true;
    S.artAudit = o.artAudit !== false;
    S.harmonizeMode = ['auto', 'on', 'off'].includes(o.harmonizeMode)
      ? o.harmonizeMode : (o.harmonize === undefined ? 'auto' : (o.harmonize ? 'on' : 'off'));
    S.harmonizeStrength = Number.isFinite(Number(o.harmonizeStrength))
      ? Number(o.harmonizeStrength) : (profile.harmonizeStrength || 0);
  }

  function buildPipelineConsole() {
    const profile = selectedProfile();
    const box = el('section', 'rpl-console');
    box.id = 'rpLabConsole';
    const head = el('div', 'rpl-console-head');
    head.innerHTML = '<div><div class="rpl-console-title">Production image configuration</div>'
      + '<div class="rpl-console-copy">Profile changes reset the dimension matrix to its production defaults. Orange fields are manual overrides.</div></div>';
    head.appendChild(el('span', 'rpl-chip', esc((S.scenario && S.scenario.baseModel) || 'default base')
      + ' → ' + esc((S.scenario && S.scenario.editModel) || 'default edit')));
    box.appendChild(head);

    const rail = el('div', 'rpl-profile-rail');
    const labels = {
      fast: ['Fast', '4-step edits · proven figure grid · no relight'],
      balanced: ['Balanced', '6-step identity edits · proven figure grid · no relight'],
      quality: ['Quality', 'fine detail · 8-step edits · AI relighting'],
    };
    for (const id of ['fast', 'balanced', 'quality']) {
      const p = S.profiles[id] || FALLBACK_PROFILES[id];
      const b = el('button', 'rpl-profile' + (S.imageProfile === id ? ' active' : ''));
      b.type = 'button';
      b.innerHTML = '<strong>' + labels[id][0] + '</strong><span>' + labels[id][1] + '</span>';
      b.title = 'Use the ' + labels[id][0] + ' production profile';
      b.addEventListener('click', () => {
        S.imageProfile = id;
        S.resolutions = copyResolutions(p);
        if (S.harmonizeMode === 'auto') S.harmonizeStrength = p.harmonizeStrength || 0;
        refreshPipelineControls();
      });
      rail.appendChild(b);
    }
    box.appendChild(rail);

    const recipe = el('div', 'rpl-recipe');
    [
      `edit ${profile.editSteps} steps`,
      `figure ${profile.figureSteps} steps`,
      `outfit ${profile.outfitSteps} steps`,
      `emotion ${profile.emotionSteps} steps`,
      effectiveHarmonize() ? `relight on · ${S.harmonizeStrength}` : 'relight off',
      `${profile.auditLimit} audit${profile.auditLimit === 1 ? '' : 's'}/turn`,
    ].forEach((text) => recipe.appendChild(el('span', 'rpl-chip', esc(text))));
    box.appendChild(recipe);

    const switches = el('div', 'rpl-switches');
    const toggle = (key, label) => {
      const wrap = el('label', 'rpl-switch');
      const input = el('input'); input.type = 'checkbox'; input.checked = !!S[key];
      input.addEventListener('change', () => { S[key] = input.checked; });
      wrap.appendChild(input); wrap.appendChild(document.createTextNode(label));
      switches.appendChild(wrap);
    };
    toggle('autoImage', 'Reaction image');
    toggle('sceneBackground', 'Scene backgrounds');
    toggle('autoAvatarArt', 'Auto avatar art');
    toggle('artAudit', 'Vision art audit');
    toggle('integratedCompare', 'A/B integrated scene');

    const mode = el('label', 'rpl-switch', 'Relighting ');
    const sel = el('select');
    [['auto', 'Auto by profile'], ['on', 'Always on'], ['off', 'Always off']].forEach(([value, label]) => {
      const opt = el('option'); opt.value = value; opt.textContent = label; opt.selected = S.harmonizeMode === value; sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      S.harmonizeMode = sel.value;
      if (sel.value === 'auto') S.harmonizeStrength = selectedProfile().harmonizeStrength || 0;
      refreshPipelineControls();
    });
    mode.appendChild(sel); switches.appendChild(mode);

    const strength = el('label', 'rpl-switch', 'Relight strength ');
    const strengthInput = el('input'); strengthInput.type = 'number'; strengthInput.min = '0'; strengthInput.max = '1';
    strengthInput.step = '0.05'; strengthInput.value = S.harmonizeStrength;
    strengthInput.disabled = !effectiveHarmonize();
    strengthInput.addEventListener('change', () => {
      S.harmonizeStrength = Math.max(0, Math.min(1, Number(strengthInput.value) || 0));
      strengthInput.value = S.harmonizeStrength;
    });
    strength.appendChild(strengthInput); switches.appendChild(strength);
    box.appendChild(switches);
    return box;
  }

  function refreshPipelineControls() {
    const oldConsole = document.getElementById('rpLabConsole');
    if (oldConsole) oldConsole.replaceWith(buildPipelineConsole());
    const oldRes = document.getElementById('rpLabRes');
    if (oldRes) oldRes.replaceWith(buildResControls());
  }

  function buildResControls() {
    const box = el('div', 'rpl-res');
    box.id = 'rpLabRes';
    box.appendChild(el('span', 'rpl-res-title', 'Dimensions'));
    const profileRes = selectedProfile().resolutions || {};
    for (const t of RES_TYPES) {
      const defaults = profileRes[t.key] || { width: 512, height: 512 };
      const grp = el('div', 'rpl-res-grp');
      grp.appendChild(el('span', 'lab', t.label));
      const wh = el('span', 'rpl-res-wh');
      const cur = S.resolutions[t.key] || defaults;
      const mk = (dim, def) => {
        const inp = el('input');
        inp.type = 'number'; inp.min = '64'; inp.max = '2048'; inp.step = '8';
        inp.value = cur[dim] != null ? cur[dim] : def;
        inp.title = t.label + ' ' + dim;
        const mark = () => inp.classList.toggle('changed', Number(inp.value) !== def);
        mark();
        inp.addEventListener('change', () => {
          S.resolutions[t.key] = S.resolutions[t.key] || {};
          const v = Math.round(Number(inp.value));
          if (Number.isFinite(v) && v >= 64) { S.resolutions[t.key][dim] = v; inp.value = v; }
          else { inp.value = def; S.resolutions[t.key][dim] = def; }
          mark();
        });
        return inp;
      };
      wh.appendChild(mk('width', defaults.width));
      wh.appendChild(el('span', 'x', '×'));
      wh.appendChild(mk('height', defaults.height));
      grp.appendChild(wh);
      grp.appendChild(el('span', 'hint', t.hint));
      box.appendChild(grp);
    }
    return box;
  }

  function paramInput(stepKey, p, value) {
    const wrap = el('label', 'rpl-field');
    const ov = S.overrides[stepKey] || {};
    const cur = ov[p.key] != null ? ov[p.key] : value;
    if (ov[p.key] != null) wrap.classList.add('changed');
    let inputHtml;
    if (p.type === 'select') {
      const opts = p.options.map((o) => `<option value="${esc(o)}"${String(cur || '') === o ? ' selected' : ''}>${o || '(default)'}</option>`).join('');
      inputHtml = `<span>${p.key}</span><select data-k="${p.key}">${opts}</select>`;
    } else {
      inputHtml = `<span>${p.key}</span><input type="number" data-k="${p.key}" `
        + `min="${p.min}" max="${p.max}" step="${p.step}" value="${cur != null && cur !== '' ? esc(cur) : ''}">`;
    }
    wrap.innerHTML = inputHtml;
    const inp = wrap.querySelector('[data-k]');
    inp.addEventListener('change', () => {
      S.overrides[stepKey] = S.overrides[stepKey] || {};
      const raw = inp.value;
      if (raw === '' || raw == null) { delete S.overrides[stepKey][p.key]; }
      else if (p.type === 'number') {
        const value = Math.max(p.min, Math.min(p.max, Number(raw)));
        inp.value = value;
        S.overrides[stepKey][p.key] = value;
      } else { S.overrides[stepKey][p.key] = raw; }
      if (!Object.keys(S.overrides[stepKey]).length) delete S.overrides[stepKey];
      wrap.classList.toggle('changed', !!(S.overrides[stepKey] && S.overrides[stepKey][p.key] != null));
    });
    return wrap;
  }

  function renderStepCard(step) {
    const card = el('div', 'rpl-step');
    card.dataset.key = step.key;
    const p = step.params || {};
    card.appendChild(el('div', 'rpl-step-head',
      '<span class="rpl-step-title"><span class="seq">' + esc(step.seq) + '.</span>' + esc(step.key)
      + (step.replayed ? '<span class="replay">replayed (frozen)</span>' : '') + '</span>'));

    if (step.comparison) {
      const compare = el('div', 'rpl-compare');
      const pane = (title, image) => {
        const fig = el('figure');
        fig.appendChild(el('figcaption', '', title));
        if (image && image.b64) {
          const img = el('img');
          img.alt = title;
          img.src = 'data:' + (image.mime || 'image/png') + ';base64,' + image.b64;
          fig.appendChild(img);
        } else {
          fig.appendChild(el('div', 'noimg', 'No image produced'));
        }
        return fig;
      };
      compare.appendChild(pane('Keyed figure → CPU composite', step.composite));
      compare.appendChild(pane('Background + character → integrated Qwen edit', step.integrated));
      card.appendChild(compare);
      return card;
    }

    const row = el('div', 'rpl-row');
    const imgWrap = el('div', 'rpl-img');
    if (step.b64) {
      imgWrap.innerHTML = '<img alt="" src="data:' + (step.mime || 'image/png') + ';base64,' + step.b64 + '">';
    } else if (step.file) {
      imgWrap.innerHTML = '<div class="noimg">image on disk: ' + esc(step.file) + '</div>';
    } else {
      imgWrap.innerHTML = '<div class="noimg">no image</div>';
    }
    row.appendChild(imgWrap);

    if (step.preview) {
      const note = el('div', 'rpl-side');
      note.appendChild(el('div', 'rpl-meta', 'compositor output (not a model call); tune the figure/harmonize steps above to change it'));
      row.appendChild(note);
      card.appendChild(row);
      return card;
    }

    const side = el('div', 'rpl-side');
    side.appendChild(el('div', 'rpl-meta', esc(p.modelRef || '?') + (p.slot ? ' · slot ' + esc(p.slot) : '')
      + (p.width && p.height ? ' · ' + p.width + '×' + p.height : '')));

    const ins = step.inputs || {};
    const refs = Array.isArray(ins.refImages) ? ins.refImages : [];
    if (ins.initImage || refs.length) {
      const inRow = el('div', 'rpl-inputs');
      inRow.appendChild(el('span', 'rpl-inputs-label', 'inputs →'));
      if (ins.initImage) inRow.appendChild(thumb(ins.initImage, 'init'));
      refs.forEach((r, i) => inRow.appendChild(thumb(r, 'ref ' + (i + 1))));
      side.appendChild(inRow);
    }

    const ovObj = S.overrides[step.key] || {};
    const prompt = el('textarea', 'rpl-prompt');
    prompt.value = ovObj.prompt != null ? ovObj.prompt : (p.prompt || '');
    prompt.title = 'Prompt (editable); your edit applies on Regenerate';
    if (ovObj.prompt != null) prompt.classList.add('changed');
    prompt.addEventListener('input', () => {
      S.overrides[step.key] = S.overrides[step.key] || {};
      if (prompt.value === (p.prompt || '')) delete S.overrides[step.key].prompt;
      else S.overrides[step.key].prompt = prompt.value;
      if (!Object.keys(S.overrides[step.key]).length) delete S.overrides[step.key];
      prompt.classList.toggle('changed', S.overrides[step.key] && S.overrides[step.key].prompt != null);
    });
    side.appendChild(prompt);

    const params = el('div', 'rpl-params');
    for (const pd of PARAMS) params.appendChild(paramInput(step.key, pd, p[pd.key]));
    side.appendChild(params);

    const actions = el('div', 'rpl-step-actions');
    const regenOne = el('button', 'adv-btn sm', 'Regenerate ↻');
    regenOne.title = 'Re-run ONLY this step with your edits; repeatable, the flow does not continue';
    regenOne.addEventListener('click', () => regenerateStep(step.key));
    const regenFrom = el('button', 'adv-btn sm', 'Regenerate from here ⇣');
    regenFrom.title = 'Re-run this step and everything after it';
    regenFrom.addEventListener('click', () => regenerateFrom(step.key));
    actions.appendChild(regenOne);
    actions.appendChild(regenFrom);
    side.appendChild(actions);

    row.appendChild(side);
    card.appendChild(row);
    return card;
  }

  function renderSteps() {
    const body = document.getElementById('rpLabBody');
    if (!body) return;
    body.className = '';
    body.innerHTML = '';
    if (S.scenario) {
      const chars = (S.scenario.characters || []).map((c) => c.name).filter(Boolean).join(', ') || '-';
      const scenes = (S.scenario.scenes || []).map((s) => s.name).filter(Boolean).join(', ') || '-';
      body.appendChild(el('div', 'rpl-scn', 'Cast: ' + esc(chars) + '  ·  Scenes: ' + esc(scenes)));
    }
    if (!S.steps.length) { body.appendChild(el('div', 'rpl-status', S.running ? 'Running…' : 'No steps yet.')); return; }
    for (const step of S.steps) body.appendChild(renderStepCard(step));
  }

  function wireLiveEvents() {
    const a = api(); if (!a) return;
    if (S.unsub) { try { S.unsub(); } catch (_) {} S.unsub = null; }
    const upsert = (step) => {
      const i = S.steps.findIndex((s) => s.key === step.key);
      if (i >= 0) S.steps[i] = Object.assign({}, S.steps[i], step); else S.steps.push(step);
      renderSteps();
    };
    S.unsub = a.onEvent((evt) => {
      if (!evt) return;
      const p = evt.payload || {};
      if (evt.type === 'lab:step') {
        upsert(p);
      } else if (evt.type === 'mode:image-stage') {
        upsert({ key: 'stage:' + (p.stage || 'x'), label: 'composite · ' + (p.stage || 'stage'),
          preview: true, b64: p.b64, mime: p.mime, seq: '·' });
      } else if (evt.type === 'mode:image') {
        upsert({ key: 'final', label: 'final image', preview: true, b64: p.b64, mime: p.mime, seq: '✓' });
      } else if (evt.type === 'lab:comparison') {
        upsert({ key: 'A/B final', label: 'A/B final', comparison: true,
          composite: p.composite, integrated: p.integrated, seq: '↔' });
      } else if (evt.type === 'mode:image-fail') {
        status('Reaction image failed (see step errors).');
      } else if (evt.type === 'status' || evt.type === 'mode:progress') {
        if (!(p && p.done)) status(p.label || p.phase || '…');
      }
    });
  }

  async function run() {
    const a = api(); if (!a || S.running) return;
    S.running = true; S.steps = [];
    setRunningUi(true); status('Running the pipeline…'); renderSteps();
    wireLiveEvents();
    try {
      const r = await a.run({ overrides: S.overrides, options: runOptions() });
      finishRun(r);
    } catch (e) { status('Run failed: ' + (e && e.message)); }
    finally { S.running = false; setRunningUi(false); }
  }

  async function regenerateStep(stepKey) {
    const a = api(); if (!a || S.running) return;
    S.running = true;
    setRunningUi(true); status('Re-rolling “' + stepKey + '” (this step only)…');
    wireLiveEvents();
    try {
      const r = await a.regenerateStep({ stepKey, overrides: S.overrides });
      if (r && r.success) status('Re-rolled “' + stepKey + '”. Run it again, or Regenerate from here to continue.');
      else status('Failed: ' + ((r && r.error) || 'unknown'));
    } catch (e) { status('Failed: ' + (e && e.message)); }
    finally { S.running = false; setRunningUi(false); }
  }

  async function regenerateFrom(fromKey) {
    const a = api(); if (!a || S.running) return;
    S.running = true;
    setRunningUi(true); status('Regenerating from “' + fromKey + '”…');
    wireLiveEvents();
    try {
      const r = await a.regenerateFrom({ fromKey, overrides: S.overrides, options: runOptions() });
      finishRun(r);
    } catch (e) { status('Regenerate failed: ' + (e && e.message)); }
    finally { S.running = false; setRunningUi(false); }
  }

  function finishRun(r) {
    if (r && r.success) {
      if (r.scenario) S.scenario = Object.assign(S.scenario || {}, r.scenario);
      const previews = S.steps.filter((s) => s.preview || s.comparison);
      if (Array.isArray(r.steps)) S.steps = r.steps.map((s) => {
        const live = S.steps.find((x) => x.key === s.key && x.b64);
        return live ? { ...s, b64: live.b64 } : s;
      });
      for (const preview of previews) {
        if (!S.steps.some((s) => s.key === preview.key)) S.steps.push(preview);
      }
      if (r.comparison && !S.steps.some((s) => s.key === 'A/B final')) {
        S.steps.push({ key: 'A/B final', label: 'A/B final', comparison: true,
          composite: r.comparison.composite, integrated: r.comparison.integrated, seq: '↔' });
      }
      status('Done: ' + S.steps.length + ' steps. Saved to ' + (r.outDir || '(scratch)') + '.');
      renderSteps();
    } else {
      status('Failed: ' + ((r && r.error) || 'unknown'));
    }
  }

  function setRunningUi(on) {
    const btn = document.getElementById('rpLabRun');
    if (btn) btn.disabled = on;
    document.querySelectorAll('#rpLabBody .adv-btn.sm').forEach((b) => { b.disabled = on; });
  }

  async function open() {
    const a = api();
    const body = document.getElementById('rpLabBody');
    if (!a) { if (body) { body.className = 'error'; body.textContent = 'Roleplay Lab API unavailable.'; } return; }
    injectStyles();
    if (!S.scenario) {
      try {
        const r = await a.getScenario();
        if (r && r.success) {
          S.scenario = r.scenario;
          if (r.imageProfiles && Object.keys(r.imageProfiles).length) S.profiles = r.imageProfiles;
          loadScenarioControls();
        }
      } catch (_) {}
    }
    const head = document.querySelector('#rpLabRoot .adv-head');
    if (head && !document.getElementById('rpLabStatus')) {
      const pipeline = buildPipelineConsole();
      head.parentNode.insertBefore(pipeline, head.nextSibling);
      const ctrls = el('div', 'rpl-ctrls');
      ctrls.innerHTML = '<label class="rpl-ctrl">Emotion '
        + '<select id="rpLabEmotion">'
        + '<option value="neutral">neutral (no emotion step)</option>'
        + '<option value="happy">happy</option>'
        + '<option value="sad">sad</option>'
        + '<option value="angry">angry</option>'
        + '</select></label>'
        + '<span class="rpl-ctrl-hint">which emotion variant to render (figure always uses emotion + body)</span>';
      head.parentNode.insertBefore(ctrls, pipeline.nextSibling);
      const emo = ctrls.querySelector('#rpLabEmotion');
      emo.value = S.emotion;
      emo.onchange = () => { S.emotion = emo.value; };
      const res = buildResControls();
      head.parentNode.insertBefore(res, ctrls.nextSibling);
      const st = el('div', 'rpl-status'); st.id = 'rpLabStatus';
      head.parentNode.insertBefore(st, res.nextSibling);
    }
    const runBtn = document.getElementById('rpLabRun');
    if (runBtn && !runBtn._wired) { runBtn._wired = true; runBtn.addEventListener('click', run); }
    renderSteps();
  }

  function mount(el) {
    if (!el.querySelector('#rpLabRoot')) {
      el.innerHTML =
        '<div id="rpLabRoot">'
        + '<div class="adv-head">'
        +   '<div>'
        +     '<h2 class="adv-title">Roleplay Lab</h2>'
        +     '<p class="adv-sub">Run the real roleplay image pipeline for a seeded scenario, inspect each step’s prompt + params, tweak the variables, and regenerate from any step. LLM is mocked; this exercises the compositing only.</p>'
        +   '</div>'
        +   '<button class="adv-btn primary" id="rpLabRun">Run pipeline</button>'
        + '</div>'
        + '<div id="rpLabBody" class="loading">Press “Run pipeline” to start.</div>'
        + '</div>';
    }
    open();
  }

  window.LumaSetupExt.registerTab({ id: 'roleplay-lab', label: 'Roleplay Lab', mount });
})();
