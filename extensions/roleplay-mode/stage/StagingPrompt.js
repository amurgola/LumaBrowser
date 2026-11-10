const CastResolver = require('../world/CastResolver');
const CharacterMarks = require('../world/CharacterMarks');
const CharacterProfile = require('../world/CharacterProfile');
const CharacterState = require('../world/CharacterState');
const StoryLedger = require('../world/StoryLedger');

class StagingPrompt {
  static POSES = ['standing', 'sitting', 'kneeling', 'lying', 'away', 'jumping'];
  static PASSAGE_MAX = 4000;
  static THREADS_SHOWN = 6;

  static messages(data, content) {
    const d = data || {};
    const system = StagingPrompt._instructions(StagingPrompt.draws(d)) + StagingPrompt._context(d);
    const user = 'Passage:\n"""\n' + String(content || '').slice(0, StagingPrompt.PASSAGE_MAX) + '\n"""\n\nJSON:';
    return [{ role: 'system', content: system }, { role: 'user', content: user }];
  }

  static draws(data) {
    const o = data && data.options;
    if (!o || typeof o !== 'object') return { shot: true, slots: true };
    return { shot: !!o.autoImage, slots: !!(o.autoImage || o.autoAvatarArt) };
  }

  static _instructions(draws = { shot: true, slots: true }) {
    const role = draws.shot ? 'continuity tracker, wardrobe supervisor, chronicler and shot director in one'
      : 'continuity tracker, wardrobe supervisor and chronicler in one';
    const ask = draws.shot ? 'report the world-state AFTER it, what happened in it, plus the single best shot for this '
      + 'moment\'s illustration' : 'report the world-state AFTER it and what happened in it';
    return '/no_think\n'
      + 'You are the STAGE MANAGER for an interactive roleplay: ' + role + '. Read the passage and ' + ask + '. '
      + 'Respond with ONLY a single minified JSON object '
      + 'and nothing else: no prose, no code fences, no explanation.\n'
      + StagingPrompt._schema(draws)
      + 'Rules:\n'
      + StagingPrompt._castRules()
      + StagingPrompt._wardrobeRules(draws)
      + StagingPrompt._chronicleRules()
      + (draws.shot ? StagingPrompt._shotRules() : '');
  }

  static _schema(draws = { shot: true, slots: true }) {
    return 'Schema: {"newCharacters":[{"name":string,"looks":string,"personality":string}],'
      + '"location":{"name":string,"desc":string,"isNew":boolean},'
      + '"present":[{"name":string,"present":boolean,"emotion":string,"intent":string,"condition":string,'
      + '"bondUser":string,"bondChange":string,"beat":string,"leftTo":string,"revealed":boolean,"noticed":[string],'
      + '"outfit":string,'
      + (draws.slots ? '"slots":{"outer":string,"top":string,"bottom":string,"feet":string},"head":string,"face":string,' : '')
      + '"outfitChanged":boolean}],'
      + '"events":[{"kind":"event"|"reveal"|"promise"|"death"|"move"|"injury","text":string,"who":[names]}],'
      + '"clock":{"advance":"none"|"minutes"|"hours"|"next-morning"|"days","timeOfDay":string,"weather":string},'
      + '"threads":{"opened":[string],"advanced":[string],"closed":[string]}'
      + (draws.shot ? ',"shot":{"pose":one of [' + StagingPrompt.POSES.join(', ') + '],"facing":"camera"|"away",'
        + '"framing":"full"|"close","focus":[names],"group":boolean,"contact":boolean,'
        + '"action":string,"props":[strings]}' : '')
      + '}\n';
  }

  static schema(draws = { shot: true, slots: true }) {
    const str = { type: 'string' };
    const strings = { type: 'array', items: str };
    const presentProps = {
      name: str, present: { type: 'boolean' }, emotion: str, intent: str, condition: str, bondUser: str, bondChange: str,
      beat: str, leftTo: str, revealed: { type: 'boolean' }, noticed: strings, outfit: str,
    };
    if (draws.slots) {
      presentProps.slots = { type: 'object', properties: { outer: str, top: str, bottom: str, feet: str }, required: ['outer', 'top', 'bottom', 'feet'] };
      presentProps.head = str;
      presentProps.face = str;
    }
    presentProps.outfitChanged = { type: 'boolean' };
    const properties = {
      newCharacters: { type: 'array', items: { type: 'object', properties: { name: str, looks: str, personality: str }, required: ['name', 'looks', 'personality'] } },
      location: { type: 'object', properties: { name: str, desc: str, isNew: { type: 'boolean' } }, required: ['name', 'desc', 'isNew'] },
      present: { type: 'array', items: { type: 'object', properties: presentProps, required: ['name', 'present', 'emotion', 'intent', 'condition', 'bondUser', 'bondChange', 'beat', 'leftTo', 'revealed', 'noticed', 'outfit', 'outfitChanged'] } },
      events: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['event', 'reveal', 'promise', 'death', 'move', 'injury'] }, text: str, who: strings }, required: ['kind', 'text', 'who'] } },
      clock: { type: 'object', properties: { advance: { type: 'string', enum: ['none', 'minutes', 'hours', 'next-morning', 'days'] }, timeOfDay: str, weather: str }, required: ['advance', 'timeOfDay', 'weather'] },
      threads: { type: 'object', properties: { opened: strings, advanced: strings, closed: strings }, required: ['opened', 'advanced', 'closed'] },
    };
    if (draws.shot) {
      properties.shot = {
        type: 'object',
        properties: {
          pose: { type: 'string', enum: StagingPrompt.POSES.slice() }, facing: { type: 'string', enum: ['camera', 'away'] },
          framing: { type: 'string', enum: ['full', 'close'] }, focus: strings, group: { type: 'boolean' }, contact: { type: 'boolean' },
          action: str, props: strings,
        },
        required: ['pose', 'facing', 'framing', 'focus', 'group', 'contact', 'action', 'props'],
      };
    }
    return { type: 'object', properties, required: ['newCharacters', 'present', 'events', 'clock', 'threads'] };
  }

  static responseFormat(draws) {
    return { type: 'json_schema', json_schema: { name: 'stage', schema: StagingPrompt.schema(draws) } };
  }

  static _castRules() {
    return '- newCharacters: characters newly introduced in this passage, or whose '
      + 'physical appearance is revealed for the first time. "looks" = a short '
      + 'comma-separated visual description for an image generator (hair, build, '
      + 'features). "personality" = a short phrase. Do NOT include the protagonist/'
      + 'the player. Use [] if none.\n'
      + '- location: the place the action is currently happening. "name" must be a '
      + 'SHORT, GENERAL, REUSABLE place name (e.g. "the street", "the dormitory", '
      + '"the dining hall"), NOT an overly specific or proper name; the same kind '
      + 'of place should get the same name so it is recognised and reused later. If '
      + 'the place is the same as or essentially equivalent to one in the known '
      + 'locations list, REUSE that exact known name and set "isNew": false. '
      + '"isNew" is true only for a genuinely new place. Omit the whole "location" '
      + 'key if the passage does not clearly establish a place.\n'
      + '- present: EVERY non-player character physically present with the '
      + 'protagonist AFTER this passage, one entry each, exact names. Start from the '
      + 'prior present characters: keep each of them unless they clearly left (a character who '
      + 'only stood by or stayed silent is still present; give them "" for "beat"), then add arrivals. Mark '
      + 'present=false only when a known character clearly just left, and then set '
      + '"leftTo" to a short phrase saying where or why (e.g. "went to fetch the doctor"); '
      + 'otherwise omit absent characters. When the protagonist MOVES to a different place, '
      + 'presence resets: only characters described at the NEW location are '
      + 'present; anyone left behind at the previous location must be marked '
      + 'present=false, even if they were present a moment ago. '
      + '"emotion" = a brief current mood. "intent" = what they want right now, one short phrase, '
      + 'or "" if unchanged from before. "condition" = the state of their body in plain words: injuries and '
      + 'where (e.g. "sword arm severed below the elbow, bleeding heavily"), illness (feverish, vomiting, '
      + 'dysentery), hygiene (unwashed for days, freshly bathed), drunk, exhausted, soaked and the like, '
      + 'or "" if fine. Carry a standing condition forward, but write it as it is NOW, at most about 20 '
      + 'words: rewrite it rather than appending, and drop what no longer holds (once washed they are '
      + '"freshly washed", not "unwashed ... hair wet from washing"; a bound wound is "bandaged", not still '
      + '"bleeding heavily"). '
      + '"bondUser" = their standing attitude to the player in one or two words (wary, warming, trusts, '
      + 'fond, hostile, indebted); copy the known one unless this passage changed it, and when it did '
      + 'also set "bondChange" to why (else ""). "beat" = ONE past-tense sentence of what this character '
      + 'did, learned or decided in this passage, naming the player as "the player"; "" if they only stood by. '
      + '"revealed" = true ONLY when what this character hides (their "hides" in the roster) came into the open '
      + 'in THIS passage: they said it, showed it, or the player learned it; else false. '
      + '"noticed" = LASTING physical details of this character\'s body that the passage shows for the FIRST time '
      + '(calluses, a black toenail, bunions, wasted calves, a scar, a tattoo, freckles, a smell they carry), each a '
      + 'short phrase in the passage\'s own words. A detail belongs here only if it would still be true after a hot '
      + 'bath and a night\'s sleep; passing states (wet, cold, pruned, red, bluish, swollen tonight) go in "condition". '
      + 'Not clothing, not anything already in their looks or noticed list; [] if none.\n';
  }

  static _wardrobeRules(draws = { shot: true, slots: true }) {
    return StagingPrompt._outfitRules() + (draws.slots ? StagingPrompt._slotRules() : '');
  }

  static _outfitRules() {
    return '- outfit: the FULL outfit that character is realistically wearing RIGHT '
      + 'NOW, as a SHORT comma-separated description (e.g. "navy school blazer, '
      + 'white shirt, plaid skirt, loafers" or "just a towel"), always the '
      + 'complete current outfit, never just the change. If the passage describes '
      + 'their clothing, honour it. If it is silent, choose what makes sense for '
      + 'THIS place/occasion and is consistent with their known wardrobe (a school '
      + '→ a uniform or student clothes; a pool/beach → swimwear; a formal event → '
      + 'eveningwear; bed → sleepwear; training/combat → practical gear); do NOT '
      + 'leave them in a previous scene\'s clothes when those no longer fit. If '
      + 'their known wardrobe already contains an outfit that suits this scene, '
      + 'reuse that exact description. If a garment comes off, the outfit is what '
      + 'remains, including what is absent when it matters (e.g. "white dress '
      + 'shirt, loosened tie, suit trousers, no jacket").\n'
      + '- If their "currently wearing" outfit below still fits the scene and has '
      + 'NOT changed, return it VERBATIM: copy the exact same wording, do not '
      + 'reword, abbreviate, or drop adjectives, and set "outfitChanged": false. '
      + '"outfitChanged" is true only when they put on, took off, loosened, '
      + 'removed, swapped or changed clothing in THIS passage, or the new setting '
      + 'forces a different outfit.\n';
  }

  static _slotRules() {
    return '- slots: the SAME outfit split into layers. "outer" = a coat/jacket/cloak '
      + 'worn OVER the top ("" if none). "top" = the shirt/blouse/dress/upper '
      + 'garment. "bottom" = the skirt/trousers/shorts ("" when a dress already '
      + 'covers it). "feet" = shoes/boots/sandals ("" if barefoot). Each slot is a '
      + 'short phrase consistent with "outfit"; a removed garment is simply "" in '
      + 'its slot.\n'
      + '- head / face: ONLY items worn ON the head (hat, hood, headband, hair '
      + 'ornament, animal ears) / ON the face (glasses, eyepatch, mask), '
      + 'comma-separated, or "" if none. Track these separately so they survive '
      + 'expression changes.\n';
  }

  static _chronicleRules() {
    return '- events: the things in THIS passage a reader would need to remember later, each ONE concrete '
      + 'past-tense sentence with names (not pronouns). "kind": "reveal" for a secret or fact coming out, '
      + '"promise" for a promise, deal or threat, "death" when someone dies, "move" when the party travels '
      + 'somewhere new, "injury" for wounds and illness, else "event". Routine talk, scenery and mood are '
      + 'NOT events. Use [] when nothing worth remembering happened.\n'
      + '- clock: how much story time passed in this passage ("none" for a continuous beat) and the time of '
      + 'day and weather AFTER it when the passage states or clearly implies them, else "".\n'
      + '- threads: "opened" = new unresolved hooks introduced here (a question, a debt, a looming arrival), '
      + 'one short phrase each; "advanced" = known open threads this passage moved forward without resolving '
      + '(a clue, a step, a complication), copied VERBATIM from the known threads list; "closed" = known open '
      + 'threads this passage resolved, copied VERBATIM. [] when none.\n';
  }

  static _shotRules() {
    return '- shot: the illustration of THIS moment. "pose" = the dominant body pose '
      + 'of the focus character(s); use "away" ONLY when they are clearly turned '
      + 'away / showing their back. "facing" = "away" only for a deliberate '
      + 'back-view beat, else "camera". "framing" = "full" for a whole-body/action '
      + 'beat, "close" for a dialogue or emotional close-up. "focus" = the 1-2 '
      + 'present characters the image should center on (exact names); "group": '
      + 'true if two characters share the frame. "contact": true ONLY when this '
      + 'beat contains physical interaction (kissing, hugging, carrying, dancing '
      + 'together, grappling, leaning on each other, or physically handling an '
      + 'object or animal), so the moment cannot be drawn as separate figures '
      + 'standing apart. Interaction WITH THE PROTAGONIST counts: a character '
      + 'kissing, embracing or touching the protagonist is contact:true even '
      + 'though the protagonist is not listed. Ordinary talking or sitting near '
      + 'each other → false. "action": when contact is true or a prop matters, a '
      + 'SHORT visual phrase describing the physical beat exactly as it should be '
      + 'drawn (e.g. "kissing, faces close together, eyes closed"), else "". '
      + '"props": objects or animals (NEVER people) newly CENTRAL to this beat '
      + 'that the image must be about (e.g. "a small orange cat" being petted), '
      + 'NOT items merely carried, worn or handled in passing (a stack of books, '
      + 'a satchel, a lamp). Use [] if none.\n';
  }

  static _context(d) {
    const scenes = Array.isArray(d.scenes) ? d.scenes : [];
    const knownScenes = scenes.map((s) => s.name).filter(Boolean);
    const currentState = d.currentState || {};
    const currentScene = scenes.find((s) => s.id === currentState.sceneId) || scenes.find((s) => s.id === d.activeSceneId);
    const roster = StagingPrompt._roster(d);
    const currentPeople = StagingPrompt._currentPeople(d);
    const protagonist = StoryLedger.protagonist(d);
    const threads = StoryLedger.openThreads(d).slice(0, StagingPrompt.THREADS_SHOWN);
    return 'The player: ' + (protagonist.name || 'the protagonist') + (protagonist.persona ? ' (' + protagonist.persona + ')' : '') + '\n'
      + 'Known characters:\n' + (roster.length ? roster.join('\n') : '(none)') + '\n'
      + 'Prior current scene: ' + (currentScene && currentScene.name ? currentScene.name : '(unknown)') + '\n'
      + 'Prior present characters: ' + (currentPeople.length ? currentPeople.join(' | ') : '(none)') + '\n'
      + 'Known locations: ' + (knownScenes.length ? knownScenes.join(', ') : '(none)') + '\n'
      + 'Clock before this passage: ' + StoryLedger.clockLine(d) + '\n'
      + 'Known open threads: ' + (threads.length ? threads.join(' | ') : '(none)');
  }

  static _roster(d) {
    const chars = Array.isArray(d.characters) ? d.characters : [];
    return chars
      .filter((c) => c && c.name)
      .map((c) => {
        const known = Array.isArray(c.outfits) ? c.outfits.map((o) => o && o.desc).filter(Boolean) : [];
        const state = CharacterState.of(c);
        const profile = CharacterProfile.of(c);
        const bond = state.bondUser || profile.bonds[CharacterProfile.BOND_USER];
        return '- ' + c.name
          + ' | currently wearing: ' + (c.currentOutfitDesc || '(unknown)')
          + (known.length ? ' | known wardrobe: ' + known.join('; ') : '')
          + (bond ? ' | toward the player: ' + bond : '')
          + (state.condition ? ' | condition: ' + state.condition : '')
          + (CharacterMarks.line(c) ? ' | noticed: ' + CharacterMarks.line(c) : '')
          + (state.intent ? ' | wants: ' + state.intent : '')
          + (profile.hides ? ' | hides: ' + profile.hides : '');
      });
  }

  static _currentPeople(d) {
    return CastResolver.currentEntries(d).map(({ char, state }) => {
      const outfit = (state && state.outfitDesc) || char.currentOutfitDesc || '';
      const emotion = state && state.emotion ? ', emotion: ' + state.emotion : '';
      return char.name + (outfit ? ', wearing: ' + outfit : '') + emotion;
    });
  }
}

module.exports = StagingPrompt;
