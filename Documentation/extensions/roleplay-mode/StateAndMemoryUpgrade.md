# Roleplay Mode: state-based character management and memory (analysis and proposal)

Written 2026-10-28 against `extensions/roleplay-mode` at commit `fe17fdb`. Three parts: how the
mode works today, what the field has converged on for consistent characters and tight prose, and a
concrete upgrade design with a phased plan. Sources are listed at the end; anything the research
could not confirm from a primary source is marked as such.

## 0. Status

Implemented on the `ccr-46d6a5ca-8s0n9g` branch, all four phases. Where the
implementation differs from the design below: `appearance` and `description`
stay on the character row (the image pipeline reads them) and `profile` holds
voice, wants, hides, tells and bonds; `data.currentState` keeps its shape for
the image pipeline and each character's richer state lives in `char.state`;
the trailing anchor is folded into the newest user message rather than sent as
a system message; beats and ledger rows are keyed by assistant message id and
dropped when a turn is removed; the samplers toggle is "turn off" so the
default is on; the polish pass uses a `replaceContent` hook on the core mode
reaction. The Lab text run is `LabService.runText`.

## 1. Summary

The mode already has the right skeleton: a creative narrator call at temperature 0.9 and a strict
JSON "stage manager" side call at 0.2 that rewrites a per-moment `currentState`. That two-call
shape is exactly what every mature roleplay system has converged on. What it lacks is everything
behind that moment:

- Characters have one free-text `description` written at setup (or back-filled once by the
  stage call) and never updated. There is no profile/history/state split.
- Nothing that *happens* is recorded. No events, promises, reveals, relationship changes, time.
- The only long-term memory is the core compaction summary, whose fixed headings are
  "Files and Code", "Errors and Fixes", "Pending Jobs". It is regenerated on every turn once the
  window is 85% full and is never persisted.
- The whole roster goes into the system prompt every turn, present or not.
- There is no protagonist persona, so NPCs cannot know anything stable about the player.
- The narrator brief is "write vivid, immersive prose, vary rhythm". No length control, no POV
  or tense, no agency rule, no banned-phrase guidance, no handoff rule.
- With auto-images off, the stage call only runs when a regex spots movement or clothing words,
  so text-only players get stale state.

The proposal: give every character three records (profile, chronicle, state), add a story
ledger and a protagonist persona, make the stage call also the chronicler, replace core
compaction with a roleplay-shaped rolling summary, assemble the narrator context in layers with
only the present cast in full, and rewrite the brief around eight evidence-backed prose rules
with a length mode. Setup collapses to three fields plus AI fill.

## 2. How it works today

### 2.1 The text flow, turn by turn

1. **Setup** (`chat-ui.js` `buildSchema`, `normalizeRoleplayData`). Scenario, art style, LLM and
   context length, two image models, optional characters (name, one "Persona & history" box,
   art studio), optional scenes, image options. Everything is one JSON blob in
   `llm_conversation_meta.data` (`ChatStore.setMeta`).
2. **Opening turn**: `startConversation` sends the literal user message
   `(Begin the scene: set the stage and introduce the characters.)`.
3. **Every turn**: the page posts the whole visible thread as `messages`. `ChatModeTurn.resolve`
   calls `RoleplayModeDescriptor.buildTurn(meta)`, which returns
   `{ systemPrompt: NarratorPrompt.build(data), temperature: 0.9, modelRef }`.
   `ChatTurn._applyMode` prepends that single system message. The router honours only
   `turn.agent`, `turn.temperature`, `turn.modelRef`, `turn.systemPrompt` and `turn.compact`;
   a mode cannot add a trailing instruction, trim history, or shape the summary.
4. **Compaction** (`CompactionGate`, `Compaction`, `SummaryDirective`). When the estimate passes
   85% of the window (`ContextBudget.SHARES.compactionReserve` 0.15) the older half is replaced by
   one summary written under eight fixed coding headings. The result is used for this request
   only. Roleplay neither opts out nor supplies its own directive, so a long roleplay pays a
   180 second, code-shaped summary on every turn.
5. **The model streams prose.** The only structure asked for is `**Name:** ...` speaker lines.
6. **Post-turn** (`RoleplayPostProcessor.process`, fire-and-forget via `ModeReaction`):
   `DataMigration.migrate`; `SpeakerNames.parse` adds new bold-name speakers to the roster;
   `ArtAuditor` (images); then `StageCall.run` **if** `options.autoImage`, or a speaker was
   added, or `ProseCues.movementHint`/`outfitHint` matched, or the world was empty.
   `StageReconciler.apply` writes new characters (name, looks, personality), the location, and a
   fresh `currentState` (present cast with emotion, outfit, slots, accessories). Persist,
   `mode:world`, then the image phase.

### 2.2 What is tracked per character

`data.characters[]`: `id, name, seed, description, appearance, currentOutfit, currentOutfitDesc,
currentSlots, accessories, outfits[], art, figure`. `description` and `appearance` are written at
setup or back-filled **once** when blank; nothing updates them afterwards.

`data.currentState`: `{ sceneId, characters: [{ charId, name, present, emotion, outfitDesc,
outfitId, slots, accessories }] }`. Rebuilt from scratch by every stage call. `emotion` is a free
phrase. Wardrobe is tracked carefully (layers, accessories, negations like "no jacket").

`data.scenes[]`: `id, name, description, bg`.

Not tracked anywhere: the protagonist (name, look, what NPCs know about them); events; promises,
reveals, secrets learned, deaths; relationship state; a character's goal or what they are hiding;
time of day or elapsed time; where absent characters went; anything a scene witnessed.

### 2.3 What reaches the narrator

`NarratorPrompt.build` emits, in this order, every turn: the brief; `## Scenario` and `## Style`
(the field is labelled "Art style" in the form yet also sets the writing tone); `## Characters`
as one line per roster member, present or not; `## Current setting`; `## Current situation`
(present cast with emotion and outfit).

Consequences: context cost grows with the roster and absent characters are as salient as present
ones; persona is one blob so static facts and recent change cannot be separated; the past
survives only as raw chat until compaction replaces it with a coding summary; prose guidance is
two sentences; temperature is fixed at 0.9 with no roleplay-specific samplers (the local path
only tunes `min_p`, `top_p`, `top_k` and the three penalties per model family; DRY and XTC are not
sent).

### 2.4 Worth keeping

- The narrator/stage-manager split and the `/no_think` strict-JSON side call, which already
  proves the local model can emit a state diff reliably.
- `currentState` as an overwritten per-moment block. It needs more fields and a memory layer
  behind it, not replacing.
- `WorldDelta` and `StageReconciler` as the single place changes are applied and announced.
- `DataMigration` versioning, so a richer character shape can ship without breaking saves.
- `SpeakerNames` making the roster self-growing from prose.
- The Lab harness mocking `complete` by agent kind, so new side calls are testable offline.

## 3. What the field has converged on

### 3.1 Character consistency and memory

**Three records per character, not one.** Every mature system separates an immutable profile,
an append-only condensed history, and an overwritten current state. SillyTavern does it with
permanent card fields versus Summarize/Qvink memories versus Author's Note/Tracker; Letta
(MemGPT) with the system prompt versus editable core blocks versus archival/recall memory;
Generative Agents with the seed description versus the memory stream versus `scratch`. Qvink
Memory's README is the clearest argument against one rolling summary: rewriting a single summary
every N turns loses detail and degrades, while per-message memories never degrade and can be
edited individually. SillyTavern's own Summarize docs list the same failure modes (lost details,
hallucinated additions, degradation from the model rewriting its own summary).

**Profiles that hold up** carry hard facts in a form that is always present (description), voice
in example dialogue rather than adjectives, and a short trait list re-injected near the newest
messages to fight drift. The V2 card spec places `post_history_instructions` after the chat
history because it "carries more weight with current models than the system prompt". Community
sizing: 600 to 1000 tokens per card on cloud models, 400 to 600 on 7B to 13B local models
(convention, not a documented default). CharacterGLM's attribute set (identity, interests,
viewpoints, experiences, relationships) and CoSER's "given-circumstance acting" (profile plus
plot summary plus scene, with bracketed inner thoughts) are the academic versions of the same
idea; CoSER reports a 70B model matching GPT-4o on character fidelity with that framing.

**State blocks** are fixed-schema, regenerated by a low-temperature side call from the previous
block plus the last few messages, stored per message, and injected near the bottom of context.
The Tracker extension's schema is a good reference: time, location, weather, characters present,
and per character hair, outfit (complete, including where removed clothing is), state of dress,
posture and interaction. Its two-stage mode (list the changes, then patch the block) reduces the
side model rewriting unchanged fields. RPG Companion adds mood, inventory, quests and relationship
badges with per-character inner thoughts. The current `StagingPrompt` is already most of this.

**Load only what is in scene.** SillyTavern group chats default to "swap" (send only the active
speaker's card) and the docs warn that merging all cards produces characters "confused about
themselves, merged personalities, uncertain traits". For lore, entries keyed on a character's
name with a scan depth of 2 to 4 messages and a "sticky" of 3 to 6 messages keep that character's
notes live while they stay in scene and drop them when they leave.

**Retrieval over the past** works best when bounded by perspective. Raw vector recall over the
whole chat makes characters "weirdly omniscient" (OpenVault critique; perspective-bounded memory
papers in 2026). Generative Agents score memories by recency, importance and relevance and run a
periodic reflection step that writes insights back as memories; ablations showed each of
observation, reflection and planning mattered for believability.

**Known failure modes and the standard fixes:** character bleed (swap mode, per-character
thoughts); persona drift over long chats (re-inject the trait list at shallow depth, retrieve an
identity document each turn); forgetting outfits and injuries (schema trackers, not prose
summaries); resurrecting dead characters (a constant lore entry or a marked long-term memory);
sycophancy (explicit goals and disagreements in the profile, an inner-thought channel);
repetition loops (samplers, phrase bans, regenerate on match).

**Prompt layout:** hard identity facts at the top where they are cheap to cache; summaries after
the main prompt or at depth 2 to 4 above the retained window; rules, trait list and current state
at depth 0 to 4, because "the closer the Author's Note is to the bottom, the more impact it has".
Budget rules of thumb for 8k to 32k windows: card 500 to 1000 tokens, lore 1000 to 2000, summary
500 to 1500; SillyTavern's World Info default is 25% of the window.

### 3.2 Visceral prose without wordiness

The craft rules that transfer directly to a prompt, each with a primary source:

1. One concrete detail that proves the moment beats three abstractions (Chekhov's 1886 letter,
   Hemingway's iceberg).
2. Never narrate perception or cognition; render the stimulus and the reaction. Palahniuk's
   "thought verbs" (thinks, knows, realizes, wants, remembers, loves, hates) and the filter words
   (saw, felt, heard, noticed, seemed).
3. Ground emotion in one character-specific physical tell, never a stock one. The Emotion
   Thesaurus organises every emotion as physical signals, internal sensations and mental
   responses; the LLM failure is converging on the same five tells.
4. Dialogue stands alone: "said" or an action beat, no adverbs on tags, no explaining the line
   (Elmore Leonard; Browne and King's "Resist the Urge to Explain"). Write what they mean, then
   rewrite so they don't say it.
5. Vary sentence length; no staccato fragments as a tic, no rule-of-three lists (Provost).
6. Enter late, leave early, develop one beat, compress transitions (Deemer on scene craft).
7. End on a handoff: an action, consequence, discovery or tension, and stop before anything that
   is the player's decision. Never write for the player.
8. Length is a mode, not a fixed shape: short in dialogue, longer when the plot moves.

What the well-regarded presets actually say (verified from source): SillyTavern's own defaults
*ask for* verbosity ("elaborate, verbose, mention all relevant sensory perceptions"), which is why
the community presets exist. Marinara's preset exposes Length as Short (under 150 words), Moderate
(150 to 300), Long (over 300), Flexible (short in dialogue, longer when the plot progresses), and
argues reasoning "is obsolete for roleplay" and makes outputs more deterministic; a 2025 study of
24 models reports chain-of-thought can reduce roleplay quality. Pura's Director preset is the
most explicit anti-slop prompt found: "Use concrete nouns, direct verbs, precise sensory detail,
and spatially clear paragraphs. State actions directly; reserve figurative language for a specific
effect." "Attach physical beats to the speech or decision they affect." "End at a meaningful
handoff: an action, consequence, discovery, unresolved tension, or an opening for the director.
Stop before a decision or reaction reserved for {{user}}." Its author warns that the long banned
list "can confuse or backfire on weaker models", so small models get the short rules only.

Mechanical enforcement: DRY (multiplier 0.8, base 1.75, allowed length 2) and XTC (threshold 0.1,
probability 0.5) with min-p 0.02 on local models; a phrase ban list with regenerate-on-match or a
post-pass rewrite on API models (antislop's point: most slop phrases are multi-token, so logit
bias on single tokens damages output). The curated suppression list from antislop, EQ-Bench and
Pura's preset is in section 4.6.

Evaluation: EQ-Bench Creative Writing v3's judge rubric (positive: believable character actions,
consistent voice, elegant prose, emotionally engaging, coherent; negative: meandering, weak
dialogue, tell-don't-show, purple prose, overwrought, incongruent ending positivity) is a
ready-made judge for a text Lab. Slop Score is 60% over-represented words, 25% "not X but Y"
patterns, 15% slop trigrams against a human baseline.

## 4. Proposed design

### 4.1 Data model (`DataMigration.VERSION` 2)

```
data.protagonist = { name, pronouns, appearance, persona, knownTo: [charId] }

data.characters[i] = {
  id, name, seed, art, figure, outfits, currentOutfit*,         // unchanged
  profile: {                                                    // written once, edited rarely
    summary,            // 1-2 sentences: who they are
    appearance,         // replaces top-level appearance (migrated)
    voice,              // how they talk: 2-3 cues + one example line
    wants,              // what they want in this story
    hides,              // what they conceal
    tells,              // 2 character-specific physical tells (anger, fear, joy)
    bond: { user: '', [charId]: '' },   // starting relationships
  },
  chronicle: {                                                  // append-only, condensed
    arc: '',            // rolling 80-150 word summary of their story so far
    beats: [{ turn, text }],   // one line per turn they appeared in, newest kept verbatim
  },
  state: {                                                      // overwritten each stage call
    present, location, emotion, intent, posture,
    outfitDesc, outfitId, slots, accessories,                  // moved from currentState entry
    bondUser, bondNotes,   // 'wary' | 'warming' | 'trusts' | 'hostile' ... plus one phrase
    condition,             // injuries, drunk, exhausted, ''
    lastSeen: { turn, sceneId, note },   // for absent characters: "left for the harbour"
  },
}

data.story = {
  clock: { day, timeOfDay, weather },
  summary: '',                 // rolling story-so-far, 150-400 words, roleplay headings
  ledger: [{ turn, kind, text, charIds }],   // 'event'|'reveal'|'promise'|'death'|'move'
  threads: [{ text, open: true }],           // unresolved hooks the narrator may pull
}

data.scenes[i].memory = ''     // one line per notable thing that happened here
data.currentState = { sceneId, turn, characters: [charId] }   // presence only; detail in state
```

Migration: `appearance` moves into `profile.appearance`; `description` becomes
`profile.summary` with `voice/wants/hides/tells` filled by a one-off side call the first time the
character is in scene (not at migration time, so old saves open instantly). `shared.js` and the
`SharedParity` test gain the new readers (`profileOf`, `stateOf`, `presentIds`).

### 4.2 Simpler setup

Three visible fields: **Premise** (the scenario box, with the existing assist), **You** (name,
pronouns, one line of look or role; defaults to "the protagonist"), **Tone and length** (a select:
Snappy / Balanced / Lush, plus tense and POV defaults of present tense, second person for the
player, third person for NPCs). Everything else moves behind "More": models, art style, image
options, pre-made characters and scenes.

Characters do not need to be authored up front. When the stage call reports a new character, a
single `/no_think` **ProfileCall** fills `profile` from the premise plus the passage. The art
studio stays where it is, as an on-demand action from the roster chip. The "Persona & history"
box becomes the profile editor with the structured fields above, and an "Add character with AI"
that fills them.

### 4.3 The stage call becomes the chronicler

Extend the stage schema (one call, still `/no_think`, still 0.2) with a `chronicle` block:

```
"chronicle": {
  "events": [{"kind":"event|reveal|promise|death|move","text":string,"who":[names]}],
  "perCharacter": [{"name":string,"beat":string,"intent":string,"bondUser":string,
                    "bondChange":string,"condition":string,"leftTo":string}],
  "clock": {"advance":"none|minutes|hours|next-morning|days","timeOfDay":string,"weather":string},
  "threads": {"opened":[string],"closed":[string]}
}
```

Rules in the prompt: beats are one sentence, past tense, concrete ("Fiera admitted she sold the
map"); `bondChange` is empty unless something in this passage changed it; `leftTo` is only set
when a character leaves. `StageReconciler` appends beats to `chronicle.beats`, writes `state`,
pushes ledger rows, and advances `story.clock`.

The stage call runs **every turn**, not only when auto-images are on or a regex fires. It is a
short `/no_think` completion and the state it produces is now the memory system; the regex
`ProseCues` hints stay only as a fallback when the completion fails. The passage cap stays at
4000 characters.

### 4.4 Consolidation (replacing core compaction for this mode)

`buildTurn` returns `compact: false` so the coding-shaped summary never runs. The mode owns its
own windowing:

- **Per character**: when `chronicle.beats` passes 12 entries, a `ConsolidateCall` folds the
  oldest 8 into `chronicle.arc` (target 80 to 150 words, keeps names, promises, injuries, who
  knows what) and drops them. Newest 4 beats always stay verbatim. Low temperature, roleplay
  headings, "keep what is still true, drop what later beats made stale".
- **Story**: every 10 turns or when the ledger passes 20 rows, the same call rewrites
  `story.summary` under fixed headings: *Where we are / What has happened / What each present
  character wants right now / Open threads / Facts that must not change*. Ledger rows older than
  the summary are kept but not sent.
- **History trimming**: the narrator request keeps the newest N raw turns that fit in roughly 50%
  of the window (the same share core uses), with the rolling summary standing in for the rest.
  Because the page posts the whole thread, this needs one small core affordance: `buildTurn`
  returning `messages` (a trimmed copy) that `ChatTurn._applyMode` uses in place of
  `args.messages`. That is a few lines in `ChatTurn`, defensive like the rest of the mode seam.

This mirrors Qvink's two-tier design (recent beats verbatim, older ones summarised) with a
schema instead of free prose, which is what the Tracker and RPG Companion extensions found
necessary for outfits, injuries and relationships.

### 4.5 Context assembly (`NarratorPrompt` becomes `NarratorContext`)

Layered, top to bottom, with a token budget per layer sized from `llmCtx` (defaults for a 16k
window in brackets; everything scales with the window):

1. **Brief** (static, cacheable) [~400]: role, format, the eight prose rules, length mode, tense,
   POV, agency rule, handoff rule. See 4.6.
2. **Premise and protagonist** [~250].
3. **Story so far** [~400]: `story.summary`, then `story.clock`.
4. **Present cast, full card** [~250 each]: `profile` plus `chronicle.arc` plus the newest 4
   beats plus `state` (one line). Only characters whose `state.present` is true.
5. **Off-stage cast, one line each** [~30 each]: name, `state.lastSeen.note`, relationship to
   user. Capped at 8; beyond that only characters named in the last 6 turns.
6. **Setting** [~100]: scene description plus `scenes[i].memory`.
7. **Trimmed history** (the share above).
8. **Trailing anchor** [~150], appended **after** the history as a final system message: the
   present cast's `state` lines, open threads, the length cap, and "stop before the player's
   decision". This is the post-history-instructions pattern; it needs the second small core
   affordance, `turn.postHistoryPrompt`, appended by `ChatTurn._applyMode` after
   `args.messages` (or folded into the last user message for templates that reject a trailing
   system role).

Characters' full cards therefore load dynamically when they are in scene and shrink to a line
when they leave, which is the swap-card behaviour and the sticky-lore behaviour in one.

### 4.6 The narrator brief

Replace the current two sentences with a brief built from the research, in the positive voice
(the image prompts already learned that negations backfire on weak models):

- "You are the narrator and every character except the player. Present tense. The player is
  'you'; characters are third person. Speaker lines start `**Name:**`."
- "Concrete nouns, direct verbs. One specific sensory detail per beat, tied to a physical source
  in the scene. Reserve metaphor for a deliberate effect."
- "Show the stimulus and the character's own physical tell (listed on their card); do not name
  the emotion or narrate perceiving, realising, feeling."
- "Dialogue carries its own meaning. 'Said' or an action beat; no adverb on a tag; no explaining
  the line. People deflect, interrupt and leave things unsaid."
- "Vary sentence length. Short sentences for impact. No lists of three, no 'not X but Y'."
- "Develop one beat per reply. Compress transit; linger where attention or tension matters."
- "End on a handoff: an action, a consequence, a discovery or an unresolved tension. Stop before
  anything that is the player's decision or reaction. Never write the player's words or actions."
- Length mode: Snappy 40 to 120 words, Balanced 120 to 250, Lush 250 to 400; always shorter in a
  quick exchange.
- "Characters remember what is on their card and in the story so far, and only that. They do not
  know what they were not present for."

Banned-phrase list: a **short** list (about 15 items) in the brief for every model; the full
list (section 4.6a) is used by a post-pass only when the configured model is a large or remote
one, following Pura's warning about small models. Candidate short list: testament to, tapestry,
delve, ministrations, barely above a whisper, shivers down the spine, the air thick with, palpable,
a dance of, maybe just maybe, dust motes, metallic tang, jaw tightening, breath catching, knuckles
whitening.

4.6a Full suppression list (antislop, EQ-Bench, Pura): testament to; tapestry/weave/wove; delve;
kaleidoscope; symphony of; a dance of; ministrations; barely above a whisper; shivers down the
spine; the air thick with; palpable; bustling; nestled; labyrinthine; glinting eyes; twinkled;
thrummed; flickered; rasped; chuckles darkly; eyes never leaving; cold and calculating; body and
soul; humble abode; moth to a flame; maybe, just maybe; that was enough; they would face it
together; a reminder; was only just beginning; camaraderie; dust motes danced; metallic tang;
took a deep breath; heart pounding in her chest; casting long shadows; sun dipped below the
horizon; smile playing on her lips; days turned into weeks; felt like an eternity; words hung in
the air; brow furrowed; heart skipped a beat; renewed sense of purpose; unlike anything she had
ever; not X but Y / doesn't just X; "A beat." / "A pause."; X repeats, tasting the word; jaw
tightening; breath catching; knuckles whitening; sandalwood / ozone / cedar; a sound between an X
and a Y; "Mine."; stock names Elara, Lyra, Kael, Jaxon, Eldoria, Oakhaven, Whisperwood.

Samplers: on local models send DRY (0.8 / 1.75 / 2) and XTC (0.1 / 0.5) with min-p 0.02 for
roleplay turns. The local request path does not yet pass these keys (`FamilySampler` handles
`min_p`, `top_p`, `top_k` and the penalties), so this is a small core addition gated to the
roleplay mode, and should be confirmed per llama-server version. Temperature stays 0.9 to 1.0.

Optional post-pass: a `ProsePolishCall` that rewrites only lines matching the ban list or
"not X but Y", off by default, on for remote models.

### 4.7 Text-only flow

`requirements: ['llm', 'image']` gates the mode on an image model. Split into a text-only mode
entry (`requirements: ['llm']`, images off) or make `image` optional in the descriptor, so the
state and memory system is the product even without the render pipeline. The stage call running
every turn (4.3) is what makes text-only state current.

### 4.8 Evaluation in the Lab

Add a text scenario to `LabScenario`: a scripted 30-turn playthrough (the user turns canned),
mocks for the stage and consolidate calls, and two checks on the narrator output: a consistency
probe (does turn 25 contradict a fact set in turn 3: an injury, a promise, who knows the secret)
and a prose score (slop-score style phrase counts plus an EQ-Bench-rubric judge prompt). This is
the regression test for the whole memory design and the first place to tune budgets.

## 5. Phased plan

**Phase 1: memory without UI change** (extension only, no core change)
- `world/CharacterProfile.js`, `world/CharacterChronicle.js`, `world/CharacterState.js`
  (models), `DataMigration` v2, `shared.js` readers plus parity test.
- `stage/StagingPrompt` chronicle block; `StagingParser`, `StageReconciler` extensions;
  `stage/StoryLedger.js`.
- `RoleplayPostProcessor._wantStage` returns true every turn when `complete` exists.
- `prompts/ProfilePrompt.js` + `pipeline/ProfileCall.js` for new characters.
- `prompts/NarratorContext.js` replacing `NarratorPrompt.build` with the layered assembly
  (layers 1 to 6; the trailing anchor waits for Phase 2), present cast in full, absent in one
  line. `compact: false`.
- Tests: `StageReconciler` chronicle paths, `NarratorContext` budgets and present/absent
  layering, migration.

**Phase 2: core affordances** (small, defensive, in `ChatTurn._applyMode`, `ChatModeTurn`)
- `turn.messages` (trimmed history) and `turn.postHistoryPrompt` (trailing anchor).
- `turn.samplers` passthrough for DRY/XTC/min-p on local requests.
- `pipeline/ConsolidateCall.js` + `prompts/ConsolidatePrompt.js` for per-character arc and
  story summary; history trimming in `NarratorContext`.

**Phase 3: setup and prose**
- Three-field setup with "More"; protagonist record; tone and length mode; profile editor.
- New brief with the eight rules, length modes, short ban list; optional `ProsePolishCall`.
- Text-only mode entry.

**Phase 4: Lab**
- Text scenario, consistency probe, prose score; tune the layer budgets per context size.

## 6. Open decisions

1. Whether the trailing anchor should be a system message or folded into the last user turn.
   Some chat templates (Gemma, older Mistral) reject a trailing system role; folding is safer and
   the V2 spec's post-history instructions are usually sent that way.
2. Whether `chronicle.beats` should be stored on the message row (per-message, swipe-safe, like
   Qvink and Tracker) or in `meta.data` (simpler, matches the rest of the mode). The proposal
   uses `meta.data` with a `turn` index; regenerating a turn should drop beats with that index.
3. Default length mode. Balanced (120 to 250 words) matches Marinara's "Moderate" and the
   SillyTavern "one to four paragraphs" default; Snappy may suit the chat-bubble UI better.
4. Whether to use the image "style" field for writing tone at all. The proposal splits them.

## 7. Sources

Memory and character consistency:
1. SillyTavern World Info docs and `world-info.js` defaults (2025-26):
   https://github.com/SillyTavern/SillyTavern-Docs/blob/main/Usage/worldinfo.md ;
   https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/world-info.js
2. SillyTavern Character Design, Group Chats, Author's Note, Summarize, Chat Vectorization,
   Objective, Prompt Manager docs: https://github.com/SillyTavern/SillyTavern-Docs
3. Character Card Spec V2 (2023) https://github.com/malfoyslastname/character-card-spec-v2 ;
   V3 (2024) https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md
4. Qvink Memory (2024-25) https://github.com/qvink/SillyTavern-MessageSummarize
5. Tracker extension defaults (2024-25)
   https://github.com/kaldigo/SillyTavern-Tracker/blob/main/src/settings/defaultSettings.js
6. Guided Generations wiki and prompts (2025-26)
   https://github.com/Samueras/GuidedGenerations-Extension/wiki/PersistentGuides
7. Stepped Thinking (2024-25) https://github.com/cierru/st-stepped-thinking
8. RPG Companion (2025) https://github.com/SpicyMarinara/rpg-companion-sillytavern
9. MemoryBooks (2025) https://github.com/aikohanasaki/SillyTavern-MemoryBooks
10. Generative Agents code, Park et al. (2023) https://github.com/joonspk-research/generative_agents
11. Letta (MemGPT) constants (2025) https://github.com/letta-ai/letta/blob/archive/letta/constants.py
12. KoboldAI wiki: Memory, Author's Note and World Info
    https://github.com/KoboldAI/KoboldAI-Client/wiki/Memory,-Author's-Note-and-World-Info
13. Character-LLM, RoleLLM, Ditto, CoSER (ICML 2025), PersonaGym, RPBench-Auto repos:
    https://github.com/choosewhatulike/trainable-agents ;
    https://github.com/InteractiveNLP-Team/RoleLLM-public ; https://github.com/OFA-Sys/Ditto ;
    https://github.com/Neph0s/COSER ; https://github.com/vsamuel2003/PersonaGym ;
    https://github.com/boson-ai/RPBench-Auto
14. Papers read from abstracts only (arXiv unreachable from the sandbox): MemoryBank 2305.10250,
    MemGPT 2310.08560, CharacterGLM 2311.16832, ID-RAG 2509.25299, survey 2601.10122 (2026),
    memory-driven role-play 2603.19313 (2026)

Prose:
15. sam-paech/antislop-sampler (2024-25, ICLR 2026 paper) https://github.com/sam-paech/antislop-sampler ;
    slop-score (2025) https://github.com/sam-paech/slop-score
16. EQ-Bench Creative Writing v3 (2025-26) https://github.com/EQ-bench/creative-writing-bench
17. DRY sampler PR (2024) https://github.com/oobabooga/text-generation-webui/pull/5677 ;
    XTC PR (2024) https://github.com/oobabooga/text-generation-webui/pull/6335
18. SillyTavern built-in system prompt presets (2026)
    https://github.com/SillyTavern/SillyTavern/tree/release/default/content/presets/sysprompt
19. Marinara's guide source (2025-26) https://github.com/spicymarinara/spicymarinara.github.io
20. Pura's Director Preset 16.0 (2026) https://github.com/platberlitz/platberlitz.github.io/tree/main/preset
21. Juzek and Ward, "Why Does ChatGPT 'Delve' So Much?", COLING 2025
    https://aclanthology.org/2025.coling-main.426
22. Palahniuk, "Nuts and Bolts: 'Thought' Verbs" (2013)
    https://litreactor.com/essays/chuck-palahniuk/nuts-and-bolts-thought-verbs
23. Elmore Leonard, "Easy on the Adverbs" (NYT 2001) via
    https://www.themarginalian.org/2013/08/21/elmore-leonard-10-rules-of-writing/
24. Chekhov's 1886 letter via https://quoteinvestigator.com/2013/07/30/moon-glint/ ;
    Deemer, "Entering Late, Leaving Early" https://www.ibiblio.org/cdeemer/cfs0401.htm

Not verified (hosts unreachable from the research sandbox): NovelAI numeric defaults; the
Ali:Chat and PList guide text on rentry; the Pixijb, Celia, Smiley, Weep and Methception preset
texts; the MemGPT paper's exact flush fraction; Reddit threads beyond search snippets.
