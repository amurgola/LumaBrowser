(function () {
  if (!window.LumaChatExt) { console.error('[roleplay] LumaChatExt not present'); return; }

  if (!document.getElementById('rp-css')) {
    const link = document.createElement('link');
    link.id = 'rp-css';
    link.rel = 'stylesheet';
    link.href = '/llm-ui/ext/roleplay-mode/roleplay.css';
    document.head.appendChild(link);
  }

  if (!document.getElementById('rp-shared') && !window.RP_SHARED) {
    const s = document.createElement('script');
    s.id = 'rp-shared';
    s.src = '/llm-ui/ext/roleplay-mode/shared.js';
    document.head.appendChild(s);
  }
  function shared() { return window.RP_SHARED || null; }

  const rpProgressState = new Map();

  let lastAsstMsg = null;

  const SETUP_ART_FALLBACK = {
    basePrefix: 'character portrait, head and shoulders, detailed face,',
    baseSuffix: 'No clothing, nude shoulders, solid white background.',
    fullBody: 'Image 1 is the face identity reference only. Create a full-body character reference of the same person with realistic adult human body proportions, a normal-sized head about one-eighth of the full standing height, shoulders and torso in proportion to the head, long legs, a tall slender grown-up figure, standing upright. Photograph the whole figure straight-on at eye level, the camera directly in front at chest height, a flat even full-length front view. Show from head to shoes, with the body filling most of the frame. Same face, same eye color, same hairstyle, same hair color, same identity, one single person. Centered, full outfit, solo, solid white background.',
    emotions: {
      happy: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make a happy warm smile. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      sad: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change naturally: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression sad and downcast, with soft frown and lowered eyes. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
      angry: 'Image 1 is the base portrait and defines the hairstyle, hair color, face shape, and identity. Preserve identity, but allow the facial expression to change strongly: eyes, eyelids, eyebrows, cheeks, and mouth may move. Make the expression clearly angry: furrowed brows, narrowed eyes, hard glare, tense mouth, slight scowl. Not sad, not worried, not smiling. If eyes are visible, keep the same eye color. Head and shoulders, solo, plain background.',
    },
  };

  function charArtField() {
    const ART = (shared() && shared().SETUP_ART) || SETUP_ART_FALLBACK;
    return {
      key: 'art', type: 'charart', label: 'Character art',
      genFromKey: 'description', styleFromKey: 'style', contextFromKey: 'scenario',
      modelFromKey: 'baseModel', refModelFromKey: 'editModel',
      basePrefix: ART.basePrefix,
      baseSuffix: ART.baseSuffix,
      baseWidth: 512, baseHeight: 512,
      derivatives: [
        { key: 'happy', label: 'Happy', subject: false, prompt: ART.emotions.happy, width: 512, height: 512 },
        { key: 'sad', label: 'Sad', subject: false, prompt: ART.emotions.sad, width: 512, height: 512 },
        { key: 'angry', label: 'Angry', subject: false, prompt: ART.emotions.angry, width: 512, height: 512 },
        { key: 'fullBody', label: 'Full body', prompt: ART.fullBody, width: 768, height: 1152, steps: 4, sampler: 'euler_a', scheduler: 'sgm_uniform', cfgScale: 1, snapNative: false },
      ],
    };
  }

  const RP_TABLE = {
    settings: [
      'a medieval kingdom', 'feudal Japan', 'the golden age of piracy',
      'Victorian London', 'the wild west frontier', 'a 1920s jazz-age city',
      'a sleepy modern-day seaside town', 'a present-day big-city university',
      'a near-future megacity', 'a cyberpunk undercity', 'a deep-space station',
      'a post-apocalyptic wasteland', 'a floating sky archipelago',
      'an enchanted forest realm', 'a desert caravan route', 'ancient Rome',
    ],
    flavors: [
      'high fantasy with open magic', 'subtle hidden magic in an ordinary world',
      'strictly real life, no magic', 'supernatural mystery', 'lighthearted comedy',
      'slow-burn romance', 'political intrigue', 'a daring heist',
      'survival against the odds', 'cozy slice of life', 'noir detective story',
      'swashbuckling adventure', 'gothic horror', 'a fierce rivalry turned partnership',
    ],
    sparks: [
      'a festival is about to begin', 'a stranger arrives with an urgent request',
      'something valuable has just gone missing', 'an old letter resurfaces',
      'a storm strands everyone together', 'a rivalry comes to a head',
      'a secret is about to get out', 'an unexpected inheritance changes everything',
      'a once-in-a-lifetime opportunity opens', 'someone is not who they claim to be',
      'a debt comes due tonight', 'a door appears that was never there before',
    ],
  };
  function rpPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function cleanAiText(t) {
    let s = String(t || '');
    s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/, '');
    s = s.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('“') && s.endsWith('”'))) {
      s = s.slice(1, -1).trim();
    }
    return s;
  }

  function noThinkMessages(sys, user) {
    return [
      { role: 'system', content: '/no_think\n' + sys },
      { role: 'user', content: user + '\n/no_think' },
    ];
  }

  async function aiComplete(api, sys, user, opts) {
    if (!(api && api.chat && api.chat.complete)) {
      return { error: 'AI drafting is only available in the desktop app.' };
    }
    const messages = noThinkMessages(sys, user);
    try {
      const r = await api.chat.complete(Object.assign({ messages, temperature: 0.9, timeoutMs: 300000, noThink: true }, opts || {}));
      if (r && r.success && r.text) {
        const text = cleanAiText(r.text);
        return text ? { text } : { error: 'The model returned nothing usable. Try again.' };
      }
      return { error: (r && r.error) || 'Generation failed.' };
    } catch (e) { return { error: (e && e.message) || 'Generation failed.' }; }
  }

  async function scenarioAssist({ api, rootModel, value, setStatus }) {
    const seed = String(value || '').trim();
    const sys = 'You write premises for interactive roleplay stories the player steps into as "you". '
      + 'Reply with ONLY the scenario text: 2 to 4 sentences that set the premise, the tone, and where things begin, '
      + 'ending on a moment that invites the player to act. No title, no preamble, no quotation marks, no lists.';
    const user = seed
      ? 'Write a fun roleplay scenario tailored to this idea from the player: "' + seed + '". '
        + 'Keep their intent; sharpen the premise, tone, and opening moment.'
      : 'Write a fun roleplay scenario for the player. Weave these ingredients together naturally:\n'
        + '- Setting: ' + rpPick(RP_TABLE.settings) + '\n'
        + '- Flavor: ' + rpPick(RP_TABLE.flavors) + '\n'
        + '- Opening spark: ' + rpPick(RP_TABLE.sparks);
    setStatus('Dreaming up a scenario…');
    return {
      messages: noThinkMessages(sys, user),
      temperature: 0.9,
      timeoutMs: 300000,
      noThink: true,
      modelRef: await ensureAssistModel(api, rootModel),
    };
  }

  async function styleAssist({ api, rootModel, value, setStatus }) {
    const scenario = String((rootModel && rootModel.scenario) || '').trim();
    const seed = String(value || '').trim();
    const sys = 'You pick art direction for AI image generation. Reply with ONLY a short comma-separated art style line '
      + '(under 18 words), like "watercolor anime, soft pastel palette, dreamy lighting, detailed backgrounds". '
      + 'No sentences, no preamble, no quotation marks.';
    const lines = ['Choose one cohesive art style to apply to every image in a roleplay story.'];
    if (scenario) lines.push('The scenario: "' + scenario.slice(0, 600) + '". Match its mood, period, and tone.');
    if (seed) lines.push('The player asked for something like: "' + seed + '". Refine and build on that.');
    if (!scenario && !seed) lines.push('Pick one striking style with a clear medium, palette, and lighting.');
    setStatus('Choosing an art style…');
    return {
      messages: noThinkMessages(sys, lines.join('\n')),
      temperature: 0.8,
      timeoutMs: 300000,
      noThink: true,
      modelRef: await ensureAssistModel(api, rootModel),
    };
  }

  function cleanStyleText(t) {
    return cleanAiText(t).replace(/\s*\n+\s*/g, ', ').replace(/\s*,\s*(?:,\s*)+/g, ', ');
  }

  function cleanNameText(t) {
    return cleanAiText(t).split('\n')[0]
      .replace(/^name\s*:\s*/i, '').replace(/["'.,;:]+$/g, '').trim().slice(0, 60);
  }

  async function charNameAssist({ api, rootModel, siblingModel, value, setStatus }) {
    const scenario = String((rootModel && rootModel.scenario) || '').trim();
    const desc = String((siblingModel && siblingModel.description) || '').trim();
    const seed = String(value || '').trim();
    const others = ((rootModel && rootModel.characters) || [])
      .map((c) => c && c.name).filter((n) => n && n !== seed);
    const sys = 'You invent character names for roleplay stories. Reply with ONLY the name itself '
      + '(one to three words), nothing else: no quotes, no title, no explanation.';
    const lines = ['Invent a fitting name for one character.'];
    if (scenario) lines.push('The story: "' + scenario.slice(0, 400) + '". Match its setting and period.');
    if (desc) lines.push('Who they are: "' + desc.slice(0, 300) + '"');
    if (others.length) lines.push('Names already taken, pick something distinct: ' + others.join(', '));
    if (seed) lines.push('The player started typing "' + seed + '"; refine or complete it in the same spirit.');
    setStatus('Naming them…');
    return {
      messages: noThinkMessages(sys, lines.join('\n')),
      temperature: 0.9,
      timeoutMs: 300000,
      noThink: true,
      modelRef: await ensureAssistModel(api, rootModel),
    };
  }

  async function charPersonaAssist({ api, rootModel, siblingModel, value, setStatus }) {
    const scenario = String((rootModel && rootModel.scenario) || '').trim();
    const style = String((rootModel && rootModel.style) || '').trim();
    const name = String((siblingModel && siblingModel.name) || '').trim();
    const seed = String(value || '').trim();
    const others = ((rootModel && rootModel.characters) || [])
      .filter((c) => c && c !== siblingModel && c.name).map((c) => c.name);
    const sys = 'You write character sheets for interactive roleplay. Reply with ONLY the character '
      + 'description: 3 to 6 sentences covering appearance (hair, eyes, build, usual outfit), '
      + 'personality, background, speaking style, and their relationship to the player. '
      + 'No headings, no lists, no quotes.';
    const lines = [name
      ? 'Write the persona and history for a character named "' + name + '".'
      : 'Write the persona and history for one new character.'];
    if (scenario) lines.push('The story: "' + scenario.slice(0, 600) + '"');
    if (style) lines.push('Art style, let it color their look: "' + style.slice(0, 200) + '"');
    if (others.length) lines.push('Also in the cast, give them a distinct role and voice: ' + others.join(', '));
    if (seed) lines.push('The player sketched: "' + seed.slice(0, 400) + '". Keep that intent and build it out.');
    lines.push('Make them fun to interact with.');
    setStatus('Writing their story…');
    return {
      messages: noThinkMessages(sys, lines.join('\n')),
      temperature: 0.9,
      timeoutMs: 300000,
      noThink: true,
      modelRef: await ensureAssistModel(api, rootModel),
    };
  }

  function parseCharacterJson(text) {
    const m = String(text || '').match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const o = JSON.parse(m[0]);
        const name = String(o.name || '').trim();
        const description = String(o.description || o.persona || '').trim();
        if (name) return { name: name.slice(0, 60), description };
      } catch (_) {}
    }
    const lines = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const nm = lines[0] && lines[0].match(/^(?:name\s*:\s*)?([A-Z][\w'’-]*(?:\s+[A-Z][\w'’-]*)?)$/i);
    if (nm) return { name: nm[1].slice(0, 60), description: lines.slice(1).join('\n') };
    return null;
  }

  async function characterAssistAdd({ api, items, rootModel, setStatus }) {
    const scenario = String((rootModel && rootModel.scenario) || '').trim();
    const style = String((rootModel && rootModel.style) || '').trim();
    const existing = (items || []).map((c) => c && c.name).filter(Boolean);
    const sys = 'You invent characters for interactive roleplay. Reply with ONLY a JSON object, no code fence, shaped '
      + 'exactly like {"name":"their name","description":"3 to 6 sentences covering appearance (hair, eyes, build, '
      + 'usual outfit), personality, background, speaking style, and their relationship to the player."}';
    const lines = ['Invent one new character the player will meet.'];
    if (scenario) lines.push('Scenario: "' + scenario.slice(0, 600) + '"');
    if (style) lines.push('Art style, let it color their look: "' + style.slice(0, 200) + '"');
    if (existing.length) lines.push('Already in the cast, so pick a different name and role: ' + existing.join(', '));
    lines.push('Make them fun to interact with and give them a clear voice.');
    setStatus('Casting a character…');
    const r = await aiComplete(api, sys, lines.join('\n'), { temperature: 0.95, modelRef: await ensureAssistModel(api, rootModel) });
    if (r.error) { setStatus(r.error); return null; }
    const parsed = parseCharacterJson(r.text);
    if (!parsed) { setStatus('Could not read the model reply. Try again.'); return null; }
    return parsed;
  }

  const CTX_OPTIONS = [
    { value: '', label: 'Keep current' },
    { value: '4096', label: '4k' },
    { value: '8192', label: '8k' },
    { value: '16384', label: '16k' },
    { value: '32768', label: '32k' },
    { value: '65536', label: '64k' },
    { value: '131072', label: '128k' },
  ];

  async function fetchLlmModels(api) {
    let locals = [];
    let remote = [];
    try {
      const r = api && api.getLocalModelOptions ? await api.getLocalModelOptions() : null;
      if (r && r.success && Array.isArray(r.models)) locals = r.models;
    } catch (_) {}
    try {
      const r = api && api.listModels ? await api.listModels() : null;
      if (r && r.success && Array.isArray(r.models)) remote = r.models.filter((m) => !m.isLocal);
    } catch (_) {}
    const options = [{ value: '', label: 'Use current chat model' }]
      .concat(locals.map((m) => ({ value: m.ref, label: 'Local · ' + (m.displayName || m.name || m.ref) })))
      .concat(remote.map((m) => ({ value: m.ref, label: m.label || m.ref })));
    return { options, locals };
  }

  async function applyLlmChoice(api, data, locals) {
    try {
      if (!api || !api.setDefaults) return;
      const ref = (data && data.llmModel) || '';
      const ctx = parseInt((data && data.llmCtx) || '', 10);
      const local = ref && String(ref).indexOf('local::') === 0
        ? (locals || []).find((m) => m && m.ref === ref) : null;
      const patch = {};
      if (local && local.path) patch.modelPath = local.path;
      if (ctx > 0 && (local || !ref)) patch.contextSize = ctx;
      if (Object.keys(patch).length) await api.setDefaults(patch);
    } catch (_) {}
  }

  async function ensureAssistModel(api, rootModel) {
    const ref = (rootModel && rootModel.llmModel) || '';
    if (!ref) return undefined;
    if (String(ref).indexOf('local::') === 0) {
      const ctx = parseInt((rootModel && rootModel.llmCtx) || '', 10);
      if (ctx > 0 && api && api.setDefaults) {
        try { await api.setDefaults({ contextSize: ctx }); } catch (_) {}
      }
    }
    return ref;
  }

  function buildSchema(modelOpts, llm) {
    const all = modelOpts || [];
    const dflt = { value: '', label: 'Use image-server default' };
    const genOpts = [dflt].concat(all.filter((m) => m.kind !== 'edit' && m.kind !== 'video'));
    const editOpts = [dflt].concat(all.filter((m) => m.kind === 'edit' || (m.kind !== 'video' && m.supportsEdit)));
    const llmOpts = (llm && llm.options) || [{ value: '', label: 'Use current chat model' }];
    return {
      title: 'New roleplay',
      subtitle: 'Describe the scenario, or tap a star to have one invented for you. Characters and scenes are optional: leave them empty and they\'ll be created automatically as the story unfolds.',
      submitLabel: 'Start roleplay',
      fields: [
        {
          key: 'scenario', type: 'textarea', label: 'Scenario', required: true,
          placeholder: 'Set the premise, tone, and where things begin…',
          assist: scenarioAssist,
          assistClean: cleanAiText,
          assistTitle: 'Blank: invent a surprise scenario. Typed: build it out from your idea.',
        },
        {
          key: 'style', type: 'text', label: 'Art style',
          hint: 'applied to every generated image',
          placeholder: 'e.g. anime, My Hero Academia style, vibrant, detailed',
          assist: styleAssist,
          assistClean: cleanStyleText,
          assistTitle: 'Pick an art style that fits the scenario, or build on what you typed.',
        },
        {
          key: 'llmModel', type: 'select', label: 'Language model', half: true,
          hint: 'writes the story; unset keeps the current chat model',
          options: llmOpts,
        },
        {
          key: 'llmCtx', type: 'select', label: 'Context length', half: true,
          hint: 'how much story the model keeps in memory (local models only)',
          options: CTX_OPTIONS,
        },
        {
          key: 'baseModel', type: 'select', label: 'Base image model', half: true,
          hint: 'draws character and scene art (a generation model, e.g. Anima)', options: genOpts,
        },
        {
          key: 'editModel', type: 'select', label: 'Scene image model', half: true,
          hint: 'places talking characters into scenes (an edit model, e.g. Qwen-Image-Edit)',
          options: editOpts,
        },
        {
          key: 'characters', type: 'repeater', label: 'Characters (optional)', itemLabel: 'Character',
          hint: 'anyone you add starts on stage; new characters also join automatically as the story unfolds',
          assistAdd: characterAssistAdd,
          assistAddLabel: 'Add character with AI',
          assistTitle: 'Invent a character who fits the scenario and art style.',
          fields: [
            {
              key: 'name', type: 'text', label: 'Name', required: true,
              assist: charNameAssist, assistClean: cleanNameText,
              assistTitle: 'Invent a name that fits the story (or refine what you typed).',
            },
            {
              key: 'description', type: 'textarea', label: 'Persona & history', placeholder: 'Personality, background, speaking style, relationship to you…',
              assist: charPersonaAssist, assistClean: cleanAiText,
              assistTitle: 'Write their persona and history from the story, style, and name.',
            },
            charArtField(),
          ],
        },
        {
          key: 'scenes', type: 'repeater', label: 'Scenes (optional)', itemLabel: 'Scene',
          hint: 'empty environments the story moves through; characters are placed into them later',
          fields: [
            { key: 'name', type: 'text', label: 'Name', required: true, placeholder: 'e.g. The Café' },
            { key: 'description', type: 'textarea', label: 'Description', placeholder: 'What this place looks and feels like…' },
            { key: 'bg', type: 'image', label: 'Scene art', genFromKey: 'description', styleFromKey: 'style', modelFromKey: 'baseModel', promptPrefix: 'wide establishing shot of an empty environment, no people, scenery,', width: 768, height: 512 },
          ],
        },
        {
          key: 'options', type: 'group', label: 'Options',
          fields: [
            {
              key: 'imageProfile', type: 'select', label: 'Image generation profile',
              hint: 'Balanced is recommended. Fast reduces edit resolution and passes; Quality keeps native edits and relighting.',
              options: [
                { value: 'balanced', label: 'Balanced (recommended)' },
                { value: 'fast', label: 'Fast (shortest wait)' },
                { value: 'quality', label: 'Quality (slower, maximum detail)' },
              ],
            },
            { key: 'autoImage', type: 'toggle', label: 'Create an image when the visible scene changes' },
            { key: 'sceneBackground', type: 'toggle', label: 'Update the chat background to match the environment' },
            { key: 'autoAvatarArt', type: 'toggle', label: 'Auto-generate character art as new characters appear' },
            {
              key: 'harmonizeMode', type: 'select', label: 'Extra AI relighting pass',
              hint: 'Auto enables relighting only for Quality.',
              options: [
                { value: 'auto', label: 'Auto (follow the profile)' },
                { value: 'on', label: 'Always on' },
                { value: 'off', label: 'Always off' },
              ],
            },
            {
              key: 'harmonizeStrength', type: 'number', label: 'Blend strength',
              hint: '0 to 1. Lower keeps the composite crisper, higher relights more (default 0.07)',
              min: 0, max: 1, step: 0.05,
            },
          ],
        },
        {
          key: 'diagnostics', type: 'group', label: 'Diagnostics',
          fields: [
            {
              key: 'runTest', type: 'button', label: 'Run image pipeline test',
              hint: 'Generates scene → face → angry → full body → in-scene composite with the selected models and reports per-step timing. Uses a throwaway test character; your roleplay is untouched.',
              onClick: ({ api, rootModel, setStatus }) => runPipelineTest(api, rootModel, setStatus),
            },
          ],
        },
      ],
    };
  }

  async function fetchImageModels(api) {
    try {
      const r = api && api.image && api.image.getModelsView ? await api.image.getModelsView() : null;
      const list = (r && r.success && r.scan && r.scan.models) || [];
      return list.map((m) => ({ value: m.id, label: m.displayName || m.id, kind: m.kind, supportsEdit: !!m.supportsEdit }));
    } catch (_) { return []; }
  }

  function mkId(prefix, i) {
    return prefix + '_' + Date.now().toString(36) + '_' + i + '_' + Math.random().toString(36).slice(2, 6);
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escAttr(s) {
    return escHtml(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inlineMd(s) {
    let out = escHtml(s);
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    out = out.replace(/_([^_\n]+)_/g, '<em>$1</em>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    out = out.replace(/\n/g, '<br>');
    return out;
  }

  function renderAttributedHtml(rest) {
    const s = String(rest || '');
    const re = /["“]([^"”]+)["”]/g;
    let out = '';
    let last = 0;
    let m;
    const action = (frag) => (frag ? '<span class="rp-action">' + inlineMd(frag) + '</span>' : '');
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) out += action(s.slice(last, m.index));
      out += '<span class="rp-speech">' + inlineMd(m[0]) + '</span>';
      last = re.lastIndex;
    }
    if (last < s.length) out += action(s.slice(last));
    return out;
  }

  function charAvatarFor(c, emotion) {
    if (c && c.art) {
      if (emotion && c.art[emotion] && c.art[emotion].b64) return c.art[emotion];
      if (emotion && Array.isArray(c.art.extraEmotions)) {
        const key = String(emotion).toLowerCase();
        const extra = c.art.extraEmotions.find((e) => e && e.b64
          && (String(e.id || '').toLowerCase() === key || String(e.name || '').toLowerCase() === key));
        if (extra) return extra;
      }
      if (c.art.base && c.art.base.b64) return c.art.base;
    }
    if (c && c.avatar && c.avatar.b64) return c.avatar;
    return null;
  }
  function detectEmotion(text, ch) {
    const t = String(text || '').toLowerCase();
    if (ch && ch.art && Array.isArray(ch.art.extraEmotions)) {
      const extra = ch.art.extraEmotions.find((e) => e && e.b64 && e.name
        && new RegExp('\\b' + String(e.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase() + '\\b').test(t));
      if (extra) return extra.id || extra.name;
    }
    if (/\b(laugh|grin|smile|smiling|happy|delight|cheer|joy|chuckle)/.test(t)) return 'happy';
    if (/\b(angry|furious|snarl|glare|rage|shout|yell|growl|scowl|seethe)/.test(t)) return 'angry';
    if (/\b(cry|tears|sob|sad|frown|sigh|somber|grief|weep|tremble)/.test(t)) return 'sad';
    return null;
  }

  function parseSpeaker(para) {
    const m = para.match(/^\*\*\s*([^*:]+?)\s*:?\s*\*\*\s*:?\s*([\s\S]*)$/);
    if (!m) return null;
    return { name: m[1].trim(), rest: m[2] };
  }

  function splitInlineSpeaker(para, chars) {
    const re = /\*\*\s*([^*:\n]+?)\s*:?\s*\*\*\s*:?\s*/g;
    let m;
    while ((m = re.exec(para))) {
      if (m.index === 0) continue;
      const ch = chars.find((c) => c.name && c.name.toLowerCase() === m[1].trim().toLowerCase());
      if (!ch) continue;
      const after = para.slice(m.index + m[0].length);
      if (!/^["“'‘]/.test(after) && !/^[A-Z]/.test(after)) continue;
      return { ch, before: para.slice(0, m.index).trim(), rest: after };
    }
    return null;
  }

  function cleanStrayMarkers(text, chars) {
    return text.replace(/\*\*\s*([^*:\n]+?)\s*:?\s*\*\*\s*:?\s*/g, (full, name) => {
      const ch = chars.find((c) => c.name && c.name.toLowerCase() === String(name).trim().toLowerCase());
      return ch ? ch.name + ' ' : full;
    });
  }

  function sanitizeContent(content) {
    return String(content || '')
      .replace(/<<<\s*WORLD\s*>>>[\s\S]*?<<<\s*END\s*>>>/gi, '')
      .replace(/```choices[^\S\n]*\n?[\s\S]*?(?:```|$)/, '')
      .trim();
  }

  function hashColor(name) {
    let h = 0;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return 'hsl(' + (h % 360) + ' 52% 42%)';
  }
  function placeholderAvatarEl(ch, ctx, cls) {
    const d = document.createElement('button');
    d.type = 'button';
    d.className = (cls || 'rp-line-av') + ' rp-blank-av';
    d.style.background = hashColor(ch.name);
    d.textContent = (String(ch.name || '?').trim()[0] || '?').toUpperCase();
    d.title = 'Generate art for ' + (ch.name || 'this character');
    d.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      generateCharacterArt(ctx.api, ctx, ch.id);
    });
    return d;
  }

  function renderRoleplayBody(body, content, chars, ctx) {
    const paras = sanitizeContent(content).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    body.innerHTML = '';
    body.classList.add('rp-body');

    const appendSpeakerLine = (ch, rest) => {
      const line = document.createElement('div');
      line.className = 'rp-line';
      const avatar = charAvatarFor(ch, detectEmotion(rest, ch));
      if (avatar && avatar.b64) {
        const av = document.createElement('img');
        av.className = 'rp-line-av';
        av.src = 'data:' + (avatar.mime || 'image/png') + ';base64,' + avatar.b64;
        av.alt = ch.name;
        av.title = ch.name;
        line.appendChild(av);
      } else if (ctx) {
        line.appendChild(placeholderAvatarEl(ch, ctx, 'rp-line-av'));
      }
      const txt = document.createElement('div');
      txt.className = 'rp-line-text';
      txt.innerHTML = '<strong class="rp-speaker">' + escHtml(ch.name) + '</strong> ' + renderAttributedHtml(rest);
      line.appendChild(txt);
      body.appendChild(line);
    };
    const appendNarr = (text) => {
      const narr = document.createElement('div');
      narr.className = 'rp-narr';
      narr.innerHTML = inlineMd(cleanStrayMarkers(text, chars));
      body.appendChild(narr);
    };

    for (const para of paras) {
      const sp = parseSpeaker(para);
      const ch = sp && chars.find((c) => c.name && c.name.toLowerCase() === sp.name.toLowerCase());
      if (ch) { appendSpeakerLine(ch, sp.rest); continue; }
      const inl = splitInlineSpeaker(para, chars);
      if (inl) {
        if (inl.before) appendNarr(inl.before);
        appendSpeakerLine(inl.ch, inl.rest);
        continue;
      }
      appendNarr(para);
    }
  }

  function appendSceneImage(asstEl, img) {
    if (!asstEl || !img || !img.b64) return;
    asstEl.querySelectorAll('.rp-scene-loading, .rp-scene-img').forEach((e) => e.remove());
    const fig = document.createElement('div');
    fig.className = 'rp-scene-img';
    const im = document.createElement('img');
    im.src = 'data:' + (img.mime || 'image/png') + ';base64,' + img.b64;
    fig.appendChild(im);
    asstEl.appendChild(fig);
  }

  function showSceneLoading(asstEl, label) {
    if (!asstEl || asstEl.querySelector('.rp-scene-img')) return null;
    let box = asstEl.querySelector('.rp-scene-loading');
    const created = !box;
    if (!box) {
      box = document.createElement('div');
      box.className = 'rp-scene-loading';
      const stage = document.createElement('div');
      stage.className = 'rp-scene-stage-wrap';
      const spin = document.createElement('span');
      spin.className = 'luma-spinner luma-spinner--lg rp-scene-spin';
      const t = document.createElement('span');
      t.className = 'rp-scene-loading-t';
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'rp-scene-cancel';
      cancel.textContent = 'Cancel image';
      cancel.title = 'Stop the current image and the remaining image stages for this turn';
      cancel.addEventListener('click', async () => {
        cancel.disabled = true;
        t.textContent = 'Canceling image…';
        try {
          const imageApi = window.llmDiagAPI && window.llmDiagAPI.image;
          if (imageApi && typeof imageApi.generateAbort === 'function') await imageApi.generateAbort();
        } catch (_) {}
      });
      box.appendChild(stage);
      box.appendChild(spin);
      box.appendChild(t);
      box.appendChild(cancel);
      asstEl.appendChild(box);
    }
    const t = box.querySelector('.rp-scene-loading-t');
    if (t) { if (label) t.textContent = label; else if (created) t.textContent = 'Generating image…'; }
    return box;
  }
  function showSceneStage(asstEl, b64, mime) {
    if (!asstEl || !b64 || asstEl.querySelector('.rp-scene-img')) return;
    const box = showSceneLoading(asstEl, null);
    if (!box) return;
    const wrap = box.querySelector('.rp-scene-stage-wrap');
    if (!wrap) return;
    let im = wrap.querySelector('img');
    if (!im) { im = document.createElement('img'); wrap.appendChild(im); }
    im.src = 'data:' + (mime || 'image/png') + ';base64,' + b64;
    box.classList.add('has-stage');
  }
  function clearSceneLoading(asstEl) {
    if (asstEl) asstEl.querySelectorAll('.rp-scene-loading').forEach((e) => e.remove());
  }

  function normOutfit(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9, ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function clientBodyRef(c, state) {
    const S = shared();
    if (S) return S.characterBodyRefForState(c, state);
    const outfits = Array.isArray(c.outfits) ? c.outfits : [];
    if (state) {
      if (state.outfitId) {
        const byId = outfits.find((o) => o && o.id === state.outfitId && o.b64);
        if (byId) return byId.b64;
      }
      if (state.outfitDesc) {
        const want = normOutfit(state.outfitDesc);
        const byDesc = want && outfits.find((o) => o && o.b64 && normOutfit(o.desc) === want);
        if (byDesc) return byDesc.b64;
      }
    }
    const cur = c.currentOutfit && outfits.find((o) => o && o.id === c.currentOutfit);
    if (cur && cur.b64) return cur.b64;
    if (c.figure && c.figure.b64) return c.figure.b64;
    const art = c.art || {};
    return (art.fullBody && art.fullBody.b64) || (art.base && art.base.b64) || (c.avatar && c.avatar.b64) || null;
  }
  function clientPresentEntries(data, content) {
    const S = shared();
    if (S) return S.charactersForCurrentMoment(data, content);
    const chars = Array.isArray(data.characters) ? data.characters : [];
    const stateChars = data.currentState && Array.isArray(data.currentState.characters)
      ? data.currentState.characters : [];
    let present = stateChars
      .filter((s) => s && s.present !== false)
      .map((s) => {
        const c = chars.find((x) => (s.charId && x.id === s.charId)
          || (s.name && x.name && x.name.toLowerCase() === String(s.name).toLowerCase()));
        return c ? { char: c, state: s } : null;
      })
      .filter(Boolean);
    if (!present.length) {
      const lower = String(content || '').toLowerCase();
      present = chars
        .filter((c) => c.name && lower.includes(String(c.name).toLowerCase()))
        .map((c) => ({ char: c, state: null }));
    }
    return present;
  }

  function clientReactionRefs(data, content, excludeMessageId) {
    const present = clientPresentEntries(data, content);
    const refs = [];
    for (const e of present.slice(0, 2)) { const b = clientBodyRef(e.char, e.state); if (b) refs.push(b); }
    const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId || null;
    const last = data.lastShot;
    const continuity = (last && last.b64 && last.sceneId && last.sceneId === sceneId
      && last.messageId !== excludeMessageId) ? last.b64 : null;
    const scene = (data.scenes || []).find((s) => s.id === sceneId);
    const sceneRef = continuity || (scene && scene.bg && scene.bg.b64) || null;
    if (sceneRef) refs.push(sceneRef);
    return refs;
  }

  function clientFallbackPrompt(data, content) {
    const presentChars = clientPresentEntries(data, content);
    const present = presentChars.map(({ char, state }) => {
      const outfit = ((state && state.outfitDesc) || char.currentOutfitDesc || '').trim();
      return char.name + (char.description ? ' (' + char.description + ')' : '') + (outfit ? ', wearing ' + outfit : '');
    }).slice(0, 2).join(' and ');
    const gist = String(content || '').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220);
    const framing = present ? 'waist-up shot, characters facing the viewer, detailed faces' : '';
    return [data.style, present ? 'featuring ' + present + ', shown in the scene' : '', gist, framing]
      .filter(Boolean).join('. ');
  }

  function clientPaintedPrompt(data, content) {
    const present = clientPresentEntries(data, content).slice(0, 2);
    const people = present.map(({ char, state }) => {
      const look = (char.appearance || '').trim();
      const outfit = ((state && state.outfitDesc) || char.currentOutfitDesc || '').trim();
      const emotion = (state && state.emotion ? String(state.emotion).trim() : '');
      return char.name + (look ? ' (' + look + ')' : '') + (emotion ? ', ' + emotion : '') + (outfit ? ', wearing ' + outfit : '');
    }).join(' and ');
    const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId;
    const scene = (data.scenes || []).find((s) => s.id === sceneId);
    const sceneBits = scene ? [scene.name, scene.description].filter(Boolean) : [];
    const sceneText = sceneBits.length
      ? 'set in ' + sceneBits.filter((v, i) => sceneBits.indexOf(v) === i).join(': ') : '';
    const gist = String(content || '').replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220);
    return [
      data.style,
      people ? 'featuring ' + people + ', shown together in the scene' : '',
      sceneText,
      gist,
      'one cohesive illustration of this exact moment: the characters naturally interacting, the camera angle and framing chosen to serve the action, faces detailed and expressive',
      'digital artwork, detailed background',
    ].filter(Boolean).join('. ');
  }

  async function createMomentImage(ctx, btn) {
    const gen = window.LumaChatExt && window.LumaChatExt.generateImage;
    if (!gen || !lastAsstMsg || !lastAsstMsg.id) {
      if (btn && !lastAsstMsg) {
        const prev = btn.textContent;
        btn.textContent = 'No response yet';
        setTimeout(() => { btn.textContent = prev; }, 1500);
      }
      return;
    }
    const msg = lastAsstMsg;
    const data = (ctx.meta && ctx.meta.data) || {};
    const turnEl = ctx.turnElForMessage ? ctx.turnElForMessage(msg.id) : null;
    const asst = turnEl && turnEl.querySelector('.cm-asst');
    const content = (turnEl && turnEl._rpContent) || msg.content || '';
    const setBusy = (label) => { if (btn) { btn.disabled = true; btn.textContent = label; } };
    const setIdle = () => { if (btn) { btn.disabled = false; btn.textContent = 'Create image'; } };

    const prompt = clientPaintedPrompt(data, content);
    const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId || null;
    const scene = (data.scenes || []).find((s) => s.id === sceneId);
    const sceneBg = (scene && scene.bg && scene.bg.b64) || null;
    const width = 768, height = 1024;

    setBusy('Painting…');
    if (asst) showSceneLoading(asst, 'Painting the moment…');
    try {
      const plate = await gen(ctx.api, {
        modelRef: data.baseModel || undefined,
        prompt,
        initImage: sceneBg || undefined,
        strength: sceneBg ? 0.72 : undefined,
        width, height,
      });
      if (!(plate && plate.b64)) {
        if (asst) clearSceneLoading(asst);
        setIdle();
        return;
      }
      let img = plate;
      const bodyRefs = clientPresentEntries(data, content).slice(0, 2)
        .map((e) => clientBodyRef(e.char, e.state)).filter(Boolean);
      if (bodyRefs.length) {
        setBusy('Matching faces…');
        if (asst) showSceneLoading(asst, 'Matching the faces…');
        const refined = await gen(ctx.api, {
          modelRef: data.editModel || undefined,
          slot: 'edit',
          prompt: [
            data.style ? 'Keep the established art style: ' + data.style + '.' : '',
            "Keep this image's background, scene, composition, framing and art style UNCHANGED; only fix the characters.",
            'Make each character EXACTLY match the character reference image(s): face, hair and current outfit.',
            'Do not add, remove, duplicate or move any people, and do not change the setting.',
          ].filter(Boolean).join(' '),
          initImage: plate.b64,
          refImages: bodyRefs,
          strength: 0.55,
          steps: 6,
          width, height,
        });
        if (refined && refined.b64) img = refined;
      }
      if (asst) appendSceneImage(asst, { b64: img.b64, mime: img.mime });
      data.images = data.images || {};
      data.images[msg.id] = Object.assign({}, data.images[msg.id], {
        b64: img.b64, mime: img.mime || 'image/png',
        gen: { prompt, modelRef: data.baseModel || null, slot: null, painted: true, sceneId, width, height },
      });
      data.lastShot = { b64: img.b64, mime: img.mime || 'image/png', sceneId, messageId: msg.id };
      try { await ctx.setMeta({ data }); } catch (_) {}
    } catch (_) {
      if (asst) clearSceneLoading(asst);
    }
    setIdle();
  }

  async function regenerateTurnImage(ctx, msg, turnEl) {
    const gen = window.LumaChatExt && window.LumaChatExt.generateImage;
    if (!gen) return;
    const data = (ctx.meta && ctx.meta.data) || {};
    const asst = turnEl.querySelector('.cm-asst');
    if (!asst) return;
    const content = turnEl._rpContent || (msg && msg.content) || '';
    const stored = (msg.id && data.images && data.images[msg.id]) || {};
    const recipe = stored.gen || {};
    const refs = clientReactionRefs(data, content, msg && msg.id);
    const opts = {
      modelRef: recipe.modelRef || data.editModel || undefined,
      prompt: recipe.prompt || clientFallbackPrompt(data, content),
      refImages: refs.length ? refs : undefined,
      width: recipe.width || 768,
      height: recipe.height || 1024,
    };
    showSceneLoading(asst);
    try {
      const r = await gen(ctx.api, opts);
      if (r && r.b64) {
        appendSceneImage(asst, { b64: r.b64, mime: r.mime });
        data.images = data.images || {};
        data.images[msg.id] = Object.assign({}, data.images[msg.id], { b64: r.b64, mime: r.mime || 'image/png' });
        data.lastShot = { b64: r.b64, mime: r.mime || 'image/png', sceneId: recipe.sceneId || data.activeSceneId || null, messageId: msg.id };
        try { await ctx.setMeta({ data }); } catch (_) {}
      } else {
        clearSceneLoading(asst);
      }
    } catch (_) { clearSceneLoading(asst); }
  }

  async function removeTurn(ctx, msg, turnEl) {
    if (!msg || !msg.id) return;
    try {
      if (ctx.api && ctx.api.conv && ctx.api.conv.deleteMessage) {
        await ctx.api.conv.deleteMessage(msg.id);
      }
      const data = ctx.meta && ctx.meta.data;
      if (data) {
        if (data.images && data.images[msg.id]) delete data.images[msg.id];
        if (data.lastShot && data.lastShot.messageId === msg.id) data.lastShot = null;
        try { await ctx.setMeta({ data }); } catch (_) {}
      }
      turnEl.remove();
      if (ctx.refresh) ctx.refresh();
    } catch (_) {}
  }

  function addTurnControls(turnEl, msg, ctx) {
    const asst = turnEl.querySelector('.cm-asst');
    if (!asst || asst.querySelector('.rp-img-actions')) return;
    const bar = document.createElement('div');
    bar.className = 'rp-img-actions';
    const regen = document.createElement('button');
    regen.type = 'button'; regen.className = 'luma-btn luma-btn--sm rp-img-btn'; regen.textContent = '↻ Image';
    regen.title = 'Regenerate this turn’s image';
    regen.addEventListener('click', (e) => { e.preventDefault(); regenerateTurnImage(ctx, msg, turnEl); });
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'luma-btn luma-btn--sm rp-img-btn rp-img-btn-del'; del.textContent = 'Remove';
    del.title = 'Remove this response';
    del.addEventListener('click', (e) => { e.preventDefault(); removeTurn(ctx, msg, turnEl); });
    bar.appendChild(regen); bar.appendChild(del);
    asst.appendChild(bar);
  }

  function addUserControls(turnEl, msg, ctx) {
    const bubble = turnEl.querySelector('.cm-user-bubble') || turnEl;
    if (turnEl.querySelector('.rp-user-actions')) return;
    const bar = document.createElement('div');
    bar.className = 'rp-img-actions rp-user-actions';
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'luma-btn luma-btn--sm rp-img-btn rp-img-btn-del'; del.textContent = 'Remove';
    del.title = 'Remove this message';
    del.addEventListener('click', (e) => { e.preventDefault(); removeTurn(ctx, msg, turnEl); });
    bar.appendChild(del);
    bubble.parentNode.insertBefore(bar, bubble.nextSibling);
  }

  async function clearStoryState(ctx) {
    const cur = (ctx.meta && ctx.meta.data) || {};
    let data;
    try { data = JSON.parse(JSON.stringify(cur)); } catch (_) { data = Object.assign({}, cur); }
    (data.characters || []).forEach((c) => {
      if (!c) return;
      c.currentOutfit = null;
      c.currentOutfitDesc = '';
      c.currentSlots = null;
      c.outfits = [];
      c.figure = null;
      if (c.art) c.art.figures = {};
    });
    const firstScene = (data.scenes || [])[0];
    data.currentState = { sceneId: data.activeSceneId || (firstScene && firstScene.id) || null, characters: [] };
    data.images = {};
    data.lastShot = null;
    data.assetRetry = {};
    try { await ctx.setMeta({ data }); } catch (_) {}
    if (ctx.refresh) ctx.refresh();
  }

  function showSceneMenu(anchor, ctx) {
    document.querySelectorAll('.rp-scene-menu').forEach((m) => m.remove());
    const data = (ctx.meta && ctx.meta.data) || {};
    const scenes = data.scenes || [];
    const activeSceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId;
    const menu = document.createElement('div');
    menu.className = 'luma-menu rp-scene-menu';
    scenes.forEach((s) => {
      const it = document.createElement('button');
      it.type = 'button';
      it.className = 'luma-menu-item rp-scene-item' + (s.id === activeSceneId ? ' active' : '');
      it.textContent = s.name || '(scene)';
      it.addEventListener('click', async () => {
        menu.remove();
        const nextState = Object.assign({}, data.currentState || {}, { sceneId: s.id });
        await ctx.setMeta({ data: { activeSceneId: s.id, currentState: nextState } });
        if (data.options && data.options.sceneBackground && s.bg && s.bg.b64) {
          ctx.applyBackground(s.bg.b64, s.bg.mime);
        }
      });
      menu.appendChild(it);
    });
    const sep = document.createElement('div');
    sep.className = 'luma-menu-sep';
    menu.appendChild(sep);
    const clr = document.createElement('button');
    clr.type = 'button';
    clr.className = 'luma-menu-item rp-scene-item';
    clr.textContent = 'Clear story state';
    clr.title = 'Reset outfits, poses, presence and per-turn images to a fresh start (keeps characters, scenes and their art)';
    let armed = false;
    clr.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!armed) { armed = true; clr.textContent = 'Click again to confirm'; return; }
      menu.remove();
      await clearStoryState(ctx);
    });
    menu.appendChild(clr);
    menu.setAttribute('data-cm-overlay', '');
    document.body.appendChild(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.left = Math.max(8, r.left) + 'px';
    menu.style.top = Math.max(8, r.top - menu.offsetHeight - 8) + 'px';
    setTimeout(() => {
      const onDoc = (e) => {
        if (!menu.contains(e.target) && e.target !== anchor) {
          menu.remove();
          document.removeEventListener('click', onDoc);
        }
      };
      document.addEventListener('click', onDoc);
    }, 0);
  }

  function normalizeRoleplayData(data, prev) {
    prev = prev || {};
    data.characters = (data.characters || [])
      .filter((c) => c && c.name)
      .map((c, i) => (c.id ? c : Object.assign({
        id: mkId('char', i),
        seed: Math.floor(Math.random() * 2000000000),
      }, c)));
    data.scenes = (data.scenes || [])
      .filter((s) => s && s.name)
      .map((s, i) => (s.id ? s : Object.assign({ id: mkId('scene', i) }, s)));
    data.options = data.options || {};
    if (!['fast', 'balanced', 'quality'].includes(data.options.imageProfile)) {
      data.options.imageProfile = 'balanced';
    }
    if (!['auto', 'on', 'off'].includes(data.options.harmonizeMode)) {
      const oldValue = prev.options && prev.options.harmonize;
      data.options.harmonizeMode = oldValue === undefined ? 'auto' : (oldValue ? 'on' : 'off');
    }
    data.options.harmonize = data.options.harmonizeMode === 'on'
      || (data.options.harmonizeMode === 'auto' && data.options.imageProfile === 'quality');
    if (data.options.harmonizeMode === 'auto') {
      data.options.harmonizeStrength = data.options.harmonize ? 0.07 : 0;
    } else if (!(Number(data.options.harmonizeStrength) >= 0 && Number(data.options.harmonizeStrength) <= 1)) {
      data.options.harmonizeStrength = data.options.harmonize ? 0.07 : 0;
    }
    if (prev && Object.keys(prev).length) {
      const renderSettings = (d) => JSON.stringify({
        baseModel: d.baseModel || '',
        editModel: d.editModel || '',
        style: d.style || '',
        imageProfile: d.options && d.options.imageProfile || 'balanced',
        harmonizeMode: d.options && d.options.harmonizeMode || 'auto',
        harmonizeStrength: Number(d.options && d.options.harmonizeStrength) || 0,
        resolutions: d.options && d.options.resolutions || null,
      });
      if (renderSettings(data) !== renderSettings(prev)) {
        data.options.artRevision = (Number(prev.options && prev.options.artRevision) || 0) + 1;
      }
    }
    if (!data.scenes.find((s) => s.id === data.activeSceneId)) {
      data.activeSceneId = data.scenes[0] ? data.scenes[0].id : null;
    }
    data.currentState = data.currentState || prev.currentState || { sceneId: data.activeSceneId || null, characters: [] };
    if (!data.currentState.sceneId || !data.scenes.find((s) => s.id === data.currentState.sceneId)) {
      data.currentState.sceneId = data.activeSceneId || null;
    }
    data.currentState.characters = Array.isArray(data.currentState.characters) ? data.currentState.characters : [];
    data.images = data.images || prev.images || {};
    if (shared()) { try { shared().migrateData(data); } catch (_) {} }
    return data;
  }

  async function editRoleplaySettings(api, ctx) {
    const cur = (ctx.meta && ctx.meta.data) || {};
    const [imgModels, llm] = await Promise.all([fetchImageModels(api), fetchLlmModels(api)]);
    const schema = Object.assign(buildSchema(imgModels, llm), {
      title: 'Edit roleplay',
      subtitle: 'Update the scenario, style, models, characters, scenes, and options.',
      submitLabel: 'Save',
    });
    const edited = await window.LumaChatExt.openSchemaModal(schema, { api, initial: cur });
    if (!edited) return;
    await applyLlmChoice(api, edited, llm.locals);
    const next = normalizeRoleplayData(edited, cur);
    await ctx.setMeta({ data: next });
    if (ctx.refresh) ctx.refresh();
  }

  function renderRoster(ctx) {
    const composer = document.querySelector('.cm-composer');
    if (!composer) return;
    const data = (ctx.meta && ctx.meta.data) || {};
    const chars = Array.isArray(data.characters) ? data.characters : [];
    let roster = document.querySelector('.rp-roster');
    if (!chars.length) { if (roster) roster.remove(); return; }
    if (!roster) {
      roster = document.createElement('div');
      roster.className = 'rp-roster';
      composer.parentNode.insertBefore(roster, composer);
    }
    roster.innerHTML = '';
    const label = document.createElement('span');
    label.className = 'rp-roster-label';
    label.textContent = 'Cast';
    roster.appendChild(label);
    for (const ch of chars) {
      const chip = document.createElement('div');
      chip.className = 'rp-roster-chip';
      chip.title = ch.name + (ch.description ? ': ' + ch.description : '');
      const av = charAvatarFor(ch, null);
      if (av && av.b64) {
        const img = document.createElement('img');
        img.className = 'rp-roster-av';
        img.src = 'data:' + (av.mime || 'image/png') + ';base64,' + av.b64;
        img.title = 'Edit art for ' + ch.name;
        img.addEventListener('click', () => generateCharacterArt(ctx.api, ctx, ch.id));
        chip.appendChild(img);
      } else {
        chip.appendChild(placeholderAvatarEl(ch, ctx, 'rp-roster-av'));
      }
      const nm = document.createElement('span');
      nm.className = 'rp-roster-name';
      nm.textContent = ch.name;
      chip.appendChild(nm);
      roster.appendChild(chip);
    }
  }

  function ensureSceneButton(ctx) {
    const composer = document.querySelector('.cm-composer');
    if (!composer) return;
    const data = (ctx.meta && ctx.meta.data) || {};
    if ((data.scenes && data.scenes.length) && !composer.querySelector('.rp-scene-btn')) {
      const sceneBtn = document.createElement('button');
      sceneBtn.type = 'button';
      sceneBtn.className = 'luma-btn luma-btn--sm rp-scene-btn';
      sceneBtn.title = 'Change scene';
      sceneBtn.textContent = 'Scene';
      sceneBtn.addEventListener('click', (e) => { e.preventDefault(); showSceneMenu(sceneBtn, ctx); });
      composer.appendChild(sceneBtn);
    }
  }

  async function generateCharacterArt(api, ctx, charId) {
    const data = (ctx.meta && ctx.meta.data) || {};
    const chars = Array.isArray(data.characters) ? data.characters : [];
    const ch = chars.find((c) => c.id === charId);
    if (!ch) return;
    const subject = [ch.appearance, ch.description].filter(Boolean).join('\n') || ch.name;
    const schema = {
      title: (ch.name || 'Character'),
      subtitle: 'Generate a face with the base model, then ref-conditioned emotion + full-body shots. Tweak the description to steer the look.',
      submitLabel: 'Save',
      fields: [
        {
          key: 'description', type: 'textarea', label: 'Appearance & persona', placeholder: 'How they look (hair, build, clothing, features) and who they are…',
          assist: charPersonaAssist, assistClean: cleanAiText,
          assistTitle: 'Write their persona and history from the story and name.',
        },
        charArtField(),
      ],
    };
    const initial = {
      name: ch.name || '',
      description: subject,
      style: data.style || '',
      baseModel: data.baseModel || '',
      editModel: data.editModel || '',
      scenario: data.scenario || '',
      art: ch.art || {},
    };
    const edited = await window.LumaChatExt.openSchemaModal(schema, { api, initial });
    if (!edited) return;
    const nextChars = chars.map((c) => (c.id === charId
      ? Object.assign({}, c, { art: edited.art || c.art, description: edited.description || c.description })
      : c));
    await ctx.setMeta({ data: { characters: nextChars } });
    renderRoster(ctx);
    if (ctx.refresh) ctx.refresh();
  }

  async function runPipelineTest(api, root, setStatus) {
    const gen = window.LumaChatExt && window.LumaChatExt.generateImage;
    if (!gen) { setStatus('image helper unavailable'); return; }
    root = root || {};
    const baseModel = root.baseModel || undefined;
    const editModel = root.editModel || undefined;
    const style = root.style || 'anime, vibrant, detailed';
    const scenario = root.scenario || 'A peaceful afternoon in an open grassy field.';
    const name = 'Aria';
    const desc = 'a young woman with long auburn hair, green eyes, a simple traveler outfit';
    const results = [];
    const now = () => (window.performance ? performance.now() : Date.now());
    const ref = (b64) => (editModel && b64 ? [b64] : undefined);

    const step = async (label, opts) => {
      setStatus('Running ' + label + ' (' + (results.length + 1) + '/5)…');
      const t0 = now();
      const r = await gen(api, opts);
      results.push({ label, ms: Math.round(now() - t0), img: (r && r.b64) ? r : null, error: r && r.error });
      return r;
    };

    await step('scene', {
      modelRef: baseModel, width: 768, height: 512,
      prompt: style + ', a grassy open field under a clear sky, wide establishing shot, scenery, no people. ' + scenario,
    });
    const face = await step('face', {
      modelRef: baseModel, width: 512, height: 512,
      prompt: style + ', character portrait, head and shoulders, detailed face, ' + desc,
    });
    const faceRef = ref(face && face.b64);
    await step('angry', {
      modelRef: editModel || baseModel, refImages: faceRef, width: 512, height: 512,
      prompt: style + ', ' + desc + ', angry, fierce expression, head and shoulders, solo, plain background',
    });
    await step('full body', {
      modelRef: editModel || baseModel, refImages: faceRef, width: 512, height: 768,
      prompt: style + ', ' + desc + ', full body shot, standing, head to toe, full outfit, solo, plain background',
    });
    await step('composite', {
      modelRef: editModel || baseModel, refImages: faceRef, width: 768, height: 1024,
      prompt: style + ', ' + name + ' (' + desc + '), waist-up portrait, facing the viewer, in a grassy field. ' + scenario,
    });

    const total = results.reduce((a, r) => a + r.ms, 0);
    const ok = results.filter((r) => r.img).length;
    setStatus(ok + '/5 OK · ' + (total / 1000).toFixed(1) + 's total');
    showPipelineResults(results, total);
  }

  function showPipelineResults(results, totalMs) {
    document.querySelectorAll('.rp-test-overlay').forEach((m) => m.remove());
    const ov = document.createElement('div');
    ov.className = 'luma-modal-overlay rp-test-overlay';
    const panel = document.createElement('div');
    panel.className = 'luma-modal luma-modal--lg rp-test-panel';
    const ok = results.filter((r) => r.img).length;
    panel.appendChild(el('div', 'luma-modal-title rp-test-title', 'Image pipeline test'));
    panel.appendChild(el('div', 'luma-modal-sub rp-test-sub',
      ok + '/' + results.length + ' steps OK · total ' + (totalMs / 1000).toFixed(1) + 's'));
    const grid = el('div', 'rp-test-grid');
    for (const r of results) {
      const cell = el('div', 'rp-test-cell');
      if (r.img) {
        const im = document.createElement('img');
        im.className = 'rp-test-thumb';
        im.src = 'data:' + (r.img.mime || 'image/png') + ';base64,' + r.img.b64;
        cell.appendChild(im);
      } else {
        cell.appendChild(el('div', 'rp-test-fail', escHtml(r.error || 'failed')));
      }
      cell.appendChild(el('div', 'rp-test-cap',
        '<strong>' + escHtml(r.label) + '</strong><br>' + (r.ms / 1000).toFixed(1) + 's'));
      grid.appendChild(cell);
    }
    panel.appendChild(grid);
    const close = el('button', 'luma-btn primary rp-test-close', 'Close');
    close.addEventListener('click', () => ov.remove());
    panel.appendChild(close);
    ov.appendChild(panel);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.setAttribute('data-cm-overlay', '');
    document.body.appendChild(ov);
  }

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function collectArtifacts(data) {
    const items = [];
    const images = data.images || {};
    for (const msgId of Object.keys(images)) {
      const im = images[msgId];
      if (im && im.b64) items.push({ group: 'Scene shots', b64: im.b64, mime: im.mime, label: 'turn image', kind: 'image', key: msgId });
    }
    for (const s of (data.scenes || [])) {
      if (s.bg && s.bg.b64) items.push({ group: 'Scenes', b64: s.bg.b64, mime: s.bg.mime, label: s.name || 'scene', kind: 'scene', key: s.id });
    }
    for (const c of (data.characters || [])) {
      const g = c.name || 'Character';
      const art = c.art || {};
      for (const k of ['base', 'happy', 'sad', 'angry', 'fullBody']) {
        if (art[k] && art[k].b64) items.push({ group: g, b64: art[k].b64, mime: art[k].mime, label: k === 'base' ? 'face' : k, kind: 'art', charId: c.id, artKey: k });
      }
      for (const e of (art.extraEmotions || [])) {
        if (e && e.b64) items.push({
          group: g, b64: e.b64, mime: e.mime, label: 'emotion: ' + (e.name || 'custom'),
          kind: 'extraEmotion', charId: c.id, emotionId: e.id,
        });
      }
      if (c.figure && c.figure.b64) items.push({ group: g, b64: c.figure.b64, mime: c.figure.mime, label: 'figure', kind: 'figure', charId: c.id });
      for (const o of (c.outfits || [])) {
        if (o && o.b64) {
          const outfitLabel = 'Outfit: ' + (o.desc || o.name || 'unnamed');
          items.push({
            group: g, b64: o.b64, mime: o.mime, label: outfitLabel, title: g + ' · ' + outfitLabel,
            kind: 'outfit', charId: c.id, outfitId: o.id, current: c.currentOutfit === o.id,
          });
        }
      }
    }
    return items;
  }

  function removeArtifact(data, it) {
    if (it.kind === 'image') {
      if (data.images) delete data.images[it.key];
      if (data.lastShot && data.lastShot.messageId === it.key) data.lastShot = null;
      return;
    }
    if (it.kind === 'scene') { const s = (data.scenes || []).find((x) => x.id === it.key); if (s) s.bg = null; return; }
    const c = (data.characters || []).find((x) => x.id === it.charId);
    if (!c) return;
    if (it.kind === 'art' && c.art) { delete c.art[it.artKey]; }
    else if (it.kind === 'extraEmotion' && c.art) {
      c.art.extraEmotions = (c.art.extraEmotions || []).filter((e) => e.id !== it.emotionId);
    }
    else if (it.kind === 'figure') { c.figure = null; }
    else if (it.kind === 'outfit') {
      c.outfits = (c.outfits || []).filter((o) => o.id !== it.outfitId);
      if (c.currentOutfit === it.outfitId) {
        const next = c.outfits[0] || null;
        c.currentOutfit = next ? next.id : null;
        c.currentOutfitDesc = next ? (next.desc || '') : '';
      }
    }
  }

  async function openGallery(ctx) {
    document.querySelectorAll('.rp-gallery-overlay').forEach((m) => m.remove());
    const data = (ctx.meta && ctx.meta.data) || {};
    const ov = document.createElement('div');
    ov.className = 'luma-modal-overlay rp-gallery-overlay';
    const panel = document.createElement('div');
    panel.className = 'luma-modal luma-modal--lg rp-gallery';
    ov.appendChild(panel);

    const draw = () => {
      const d = (ctx.meta && ctx.meta.data) || {};
      const items = collectArtifacts(d);
      const groups = {};
      for (const it of items) { (groups[it.group] = groups[it.group] || []).push(it); }
      let html = '<div class="rp-gallery-head"><b>Gallery</b><span>' + items.length + ' image' + (items.length === 1 ? '' : 's') + '</span><button class="luma-icon-btn luma-icon-btn--sq rp-gallery-x" title="Close">✕</button></div>';
      if (!items.length) html += '<div class="luma-empty rp-gallery-empty">No images yet.</div>';
      for (const gname of Object.keys(groups)) {
        html += '<div class="rp-gallery-group">' + escHtml(gname) + '</div><div class="rp-gallery-grid" data-group="' + escAttr(gname) + '"></div>';
      }
      panel.innerHTML = html;
      panel.querySelector('.rp-gallery-x').addEventListener('click', () => ov.remove());
      for (const gname of Object.keys(groups)) {
        const grid = panel.querySelector('.rp-gallery-grid[data-group="' + (window.CSS && CSS.escape ? CSS.escape(gname) : gname.replace(/"/g, '')) + '"]');
        if (!grid) continue;
        for (const it of groups[gname]) {
          const cell = document.createElement('div');
          cell.className = 'rp-gallery-cell' + (it.current ? ' current' : '');
          const im = document.createElement('img');
          im.src = 'data:' + (it.mime || 'image/png') + ';base64,' + it.b64;
          im.title = it.title || it.label;
          cell.appendChild(im);
          const cap = document.createElement('div'); cap.className = 'rp-gallery-cap'; cap.textContent = it.label + (it.current ? ' (current)' : '');
          cell.appendChild(cap);
          const acts = document.createElement('div'); acts.className = 'rp-gallery-acts';
          if (it.kind === 'outfit' && !it.current) {
            const setb = document.createElement('button'); setb.className = 'luma-btn luma-btn--sm rp-img-btn'; setb.textContent = 'Wear';
            setb.title = 'Make this the current outfit';
            setb.addEventListener('click', async () => {
              const c = (d.characters || []).find((x) => x.id === it.charId);
              const outfit = c && Array.isArray(c.outfits) && c.outfits.find((o) => o.id === it.outfitId);
              if (c && outfit) {
                c.currentOutfit = it.outfitId;
                c.currentOutfitDesc = outfit.desc || c.currentOutfitDesc || '';
                const stateChar = d.currentState && Array.isArray(d.currentState.characters)
                  ? d.currentState.characters.find((s) => s.charId === c.id)
                  : null;
                if (stateChar) {
                  stateChar.outfitId = it.outfitId;
                  stateChar.outfitDesc = c.currentOutfitDesc;
                }
                await ctx.setMeta({ data: d });
                draw();
              }
            });
            acts.appendChild(setb);
          }
          const delb = document.createElement('button'); delb.className = 'luma-btn luma-btn--sm rp-img-btn rp-img-btn-del'; delb.textContent = 'Remove';
          delb.addEventListener('click', async () => { removeArtifact(d, it); await ctx.setMeta({ data: d }); draw(); if (ctx.refresh) ctx.refresh(); });
          acts.appendChild(delb);
          cell.appendChild(acts);
          grid.appendChild(cell);
        }
      }
    };
    draw();
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.setAttribute('data-cm-overlay', '');
    document.body.appendChild(ov);
  }

  window.LumaChatExt.registerMode({
    id: 'roleplay',

    async openSetup(api, ctx) {
      const [imgModels, llm] = await Promise.all([fetchImageModels(api), fetchLlmModels(api)]);
      const schema = buildSchema(imgModels, llm);
      const host = ctx && typeof ctx.setupHost === 'function' ? ctx.setupHost() : null;
      const data = host && window.LumaChatExt.openSchemaInline
        ? await window.LumaChatExt.openSchemaInline(schema, { api, host })
        : await window.LumaChatExt.openSchemaModal(schema, { api });
      if (!data) return null;
      await applyLlmChoice(api, data, llm.locals);
      return normalizeRoleplayData(data, {});
    },

    async startConversation(api, ctx) {
      ctx.sendTurn('(Begin the scene: set the stage and introduce the characters.)');
    },

    async onRestart(ctx) {
      const data = (ctx.meta && ctx.meta.data) || {};
      data.images = {};
      data.lastShot = null;
      data.assetRetry = {};
      for (const s of (data.scenes || [])) { s.bg = null; }
      if (Array.isArray(data.scenes) && data.scenes.length) data.activeSceneId = data.scenes[0].id;
      data.currentState = { sceneId: data.activeSceneId || null, characters: [] };
      for (const c of (data.characters || [])) {
        c.art = null;
        c.figure = null;
        c.outfits = [];
        c.currentOutfit = null;
        c.currentOutfitDesc = '';
        c.currentSlots = null;
      }
      try { await ctx.setMeta({ data }); } catch (_) {}
    },

    applyTheme(rootEl, meta, ctx) {
      const data = (meta && meta.data) || {};
      const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId;
      const scene = (data.scenes || []).find((s) => s.id === sceneId);
      if (data.options && data.options.sceneBackground && scene && scene.bg && scene.bg.b64) {
        ctx.applyBackground(scene.bg.b64, scene.bg.mime);
      } else {
        ctx.clearBackground();
      }
    },

    decorateComposer(els, ctx) {
      if (!els.composer) return;
      ensureSceneButton(ctx);
      if (!els.composer.querySelector('.rp-edit-btn')) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'luma-btn luma-btn--sm rp-edit-btn';
        editBtn.title = 'Roleplay settings & characters';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', (e) => { e.preventDefault(); editRoleplaySettings(ctx.api, ctx); });
        els.composer.appendChild(editBtn);
      }
      if (!els.composer.querySelector('.rp-gallery-btn')) {
        const galBtn = document.createElement('button');
        galBtn.type = 'button';
        galBtn.className = 'luma-btn luma-btn--sm rp-edit-btn rp-gallery-btn';
        galBtn.title = 'All images in this roleplay (remove / manage outfits)';
        galBtn.textContent = 'Gallery';
        galBtn.addEventListener('click', (e) => { e.preventDefault(); openGallery(ctx); });
        els.composer.appendChild(galBtn);
      }
      if (!els.composer.querySelector('.rp-createimg-btn')) {
        const imgBtn = document.createElement('button');
        imgBtn.type = 'button';
        imgBtn.className = 'luma-btn luma-btn--sm rp-edit-btn rp-createimg-btn';
        imgBtn.title = 'Paint the current moment: the scene guides the image loosely, the camera serves the action, and faces are locked from the character references';
        imgBtn.textContent = 'Create image';
        imgBtn.addEventListener('click', (e) => { e.preventDefault(); createMomentImage(ctx, imgBtn); });
        els.composer.appendChild(imgBtn);
      }
      renderRoster(ctx);
    },

    renderTurnExtras(turnEl, msg, ctx) {
      if (!msg) return;
      if (msg.role === 'user') { addUserControls(turnEl, msg, ctx); return; }
      if (msg.role !== 'assistant') return;
      lastAsstMsg = msg;
      const data = (ctx.meta && ctx.meta.data) || {};
      const asst = turnEl.querySelector('.cm-asst');
      const body = turnEl.querySelector('.cm-asst-body');
      if (!asst) return;

      const chars = Array.isArray(data.characters) ? data.characters : [];
      if (msg.content) turnEl._rpContent = msg.content;
      if (body && msg.content && body.dataset.rpRendered !== '1') {
        body.dataset.rpRendered = '1';
        renderRoleplayBody(body, msg.content, chars, ctx);
      }

      const stored = msg.id && data.images && data.images[msg.id];
      if (stored && stored.b64 && !turnEl.querySelector('.rp-scene-img')) {
        appendSceneImage(asst, stored);
      } else if (msg.id && rpProgressState.has(msg.id) && !(stored && stored.b64)) {
        const st = rpProgressState.get(msg.id);
        showSceneLoading(asst, st.label);
        if (st.stageB64) showSceneStage(asst, st.stageB64, st.stageMime);
      }
      addTurnControls(turnEl, msg, ctx);
    },

    onChatEvent(evt, ctx) {
      if (!evt) return;
      const p = evt.payload || {};

      if (evt.type === 'mode:image-start') {
        const st = rpProgressState.get(p.messageId) || {};
        rpProgressState.set(p.messageId, st);
        const turnEl = ctx.turnElForMessage(p.messageId);
        const asst = turnEl && turnEl.querySelector('.cm-asst');
        if (asst) showSceneLoading(asst, st.label);
        return;
      }
      if (evt.type === 'mode:progress') {
        const turnEl = ctx.turnElForMessage(p.messageId);
        const asst = turnEl && turnEl.querySelector('.cm-asst');
        if (p.done) {
          rpProgressState.delete(p.messageId);
          if (asst) clearSceneLoading(asst);
        } else {
          const st = rpProgressState.get(p.messageId) || {};
          st.label = p.label;
          rpProgressState.set(p.messageId, st);
          if (asst) showSceneLoading(asst, p.label);
        }
        return;
      }
      if (evt.type === 'mode:image-stage') {
        const st = rpProgressState.get(p.messageId) || {};
        st.stageB64 = p.b64; st.stageMime = p.mime;
        rpProgressState.set(p.messageId, st);
        const turnEl = ctx.turnElForMessage(p.messageId);
        const asst = turnEl && turnEl.querySelector('.cm-asst');
        if (asst) showSceneStage(asst, p.b64, p.mime);
        return;
      }
      if (evt.type === 'mode:image-fail') {
        rpProgressState.delete(p.messageId);
        const turnEl = ctx.turnElForMessage(p.messageId);
        const asst = turnEl && turnEl.querySelector('.cm-asst');
        if (asst) clearSceneLoading(asst);
        return;
      }

      if (evt.type === 'mode:image') {
        rpProgressState.delete(p.messageId);
        const turnEl = ctx.turnElForMessage(p.messageId);
        if (!turnEl) return;
        const asst = turnEl.querySelector('.cm-asst');
        if (!asst) return;
        appendSceneImage(asst, { b64: p.b64, mime: p.mime });
        if (ctx.meta && ctx.meta.data) {
          ctx.meta.data.images = ctx.meta.data.images || {};
          ctx.meta.data.images[p.messageId] = Object.assign({}, ctx.meta.data.images[p.messageId], { b64: p.b64, mime: p.mime });
        }
        return;
      }

      if (evt.type === 'mode:world') {
        if (!ctx.meta) return;
        ctx.meta.data = ctx.meta.data || {};
        const data = ctx.meta.data;
        if (Array.isArray(p.characters)) data.characters = p.characters;
        if (Array.isArray(p.scenes)) data.scenes = p.scenes;
        if (p.activeSceneId !== undefined) data.activeSceneId = p.activeSceneId;
        if (p.currentState !== undefined) data.currentState = p.currentState;
        renderRoster(ctx);
        ensureSceneButton(ctx);
        if (p.sceneChanged && data.options && data.options.sceneBackground) {
          const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId;
          const sc = (data.scenes || []).find((s) => s.id === sceneId);
          if (sc && sc.bg && sc.bg.b64) ctx.applyBackground(sc.bg.b64, sc.bg.mime);
        }
        if (p.newCharIds && p.newCharIds.length && p.messageId) {
          const turnEl = ctx.turnElForMessage(p.messageId);
          const body = turnEl && turnEl.querySelector('.cm-asst-body');
          const raw = turnEl && turnEl._rpContent;
          if (body && raw) {
            body.dataset.rpRendered = '1';
            renderRoleplayBody(body, raw, data.characters || [], ctx);
          }
        }
        return;
      }

      if (evt.type === 'mode:scene-art') {
        if (!ctx.meta || !ctx.meta.data) return;
        const data = ctx.meta.data;
        const sc = (data.scenes || []).find((s) => s.id === p.sceneId);
        if (sc) sc.bg = { b64: p.b64, mime: p.mime };
        const sceneId = (data.currentState && data.currentState.sceneId) || data.activeSceneId;
        if (data.options && data.options.sceneBackground && sceneId === p.sceneId) {
          ctx.applyBackground(p.b64, p.mime);
        }
        return;
      }
    },
  });
})();
