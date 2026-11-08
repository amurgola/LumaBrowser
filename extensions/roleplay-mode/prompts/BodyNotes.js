const PromptBudget = require('./PromptBudget');
const CharacterMarks = require('../world/CharacterMarks');

class BodyNotes {
  static RULE = 'Background facts for you, never lines to quote. Let each body decide what its owner can do, how fast '
    + 'and at what cost, every time it matters; show it in effort, breath, balance and sensation, in the story\'s own '
    + 'voice, never in medical terms. Use only what this moment calls for, and keep every one of them a capable person.';

  static SURFACE_RULE = 'What these bodies show or are going through right now (something came off, is being looked at '
    + 'or touched, or they are bleeding, sick, filthy or freshly washed). Facts, not a list to recite: where the moment '
    + 'calls for it, give one to three concrete details that fit this body, its work and what it has been through '
    + '(sight, touch, temperature, smell, taste where natural), in the story\'s own voice, plainly, never clinically. '
    + 'A glance, not an inventory. A line marked "established" was already shown: keep it exactly and never contradict '
    + 'it; a card only fills in what is not established. Once you describe a detail it is part of them.';

  static lines(grounding, present, window) {
    const g = grounding || {};
    const withNotes = (present || []).filter((c) => c && Array.isArray(g[c.id]) && g[c.id].length);
    if (!withNotes.length) return [];
    const each = Math.min(
      PromptBudget.layerTokens('body', window),
      Math.floor(PromptBudget.layerTokens('bodyTotal', window) / withNotes.length),
    );
    const out = ['', '## How their bodies work', BodyNotes.RULE];
    for (const c of withNotes) out.push(BodyNotes.block(c.name, g[c.id], each));
    return out;
  }

  static block(name, notes, cap, established = '') {
    const texts = notes.map((n) => BodyNotes.short(n.title) + ':\n' + BodyNotes.prioritised(n.body));
    const sizes = texts.map((t) => PromptBudget.estimate(t));
    const sum = sizes.reduce((a, b) => a + b, 0) || 1;
    const scale = Math.min(1, cap / sum);
    const parts = ['**' + name + '**'];
    if (established) parts.push('established: ' + established);
    texts.forEach((t, i) => parts.push(scale < 1 ? PromptBudget.clip(t, Math.max(40, Math.floor(sizes[i] * scale))) : t));
    return parts.join('\n');
  }

  static prioritised(body) {
    const lines = String(body || '').split('\n');
    const avoidAt = lines.findIndex((l) => /^- fiction gets wrong:/i.test(l));
    const keepAt = lines.findIndex((l) => /^- keep (?:them|him|her) a person:/i.test(l));
    const head = [];
    if (avoidAt >= 0) head.push('- Avoid: ' + lines[avoidAt].replace(/^- fiction gets wrong:\s*/i, ''));
    if (keepAt >= 0) head.push(lines[keepAt]);
    return head.concat(lines.filter((_, i) => i !== avoidAt && i !== keepAt)).join('\n');
  }

  static surfaceLines(surface, present, window) {
    const g = surface || {};
    const withNotes = (present || []).filter((c) => c && Array.isArray(g[c.id]) && g[c.id].length);
    if (!withNotes.length) return [];
    const each = Math.floor(PromptBudget.layerTokens('surface', window) / withNotes.length);
    const out = ['', '## Up close this turn', BodyNotes.SURFACE_RULE];
    for (const c of withNotes) out.push(BodyNotes.block(c.name, g[c.id], each, CharacterMarks.line(c)));
    return out;
  }

  static short(title) {
    return String(title || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
  }

  static label(grounding, c) {
    const notes = (grounding && c && grounding[c.id]) || [];
    return notes.length ? 'body: ' + notes.map((n) => BodyNotes.short(n.title)).join(', ') : '';
  }
}

module.exports = BodyNotes;
