const ModelText = require('../ModelText');

class ContactProfilePrompt {
  static MESSAGE_CHARS = 280;
  static CONVERSATION_CHARS = 1500;
  static MAX_PROPOSALS = 6;
  static VALUE_CHARS = 200;

  static SYSTEM = [
    'You help one person keep notes about the people and organisations that contact them.',
    'You are given ONE contact: what is already recorded about it, and the messages it sent this person (notification text, and sometimes the conversation as read from their own screen).',
    'Say only what the messages plainly show about who this contact is to them. Most messages show nothing about that: then propose nothing.',
    'Reply with ONLY a JSON object, no prose around it:',
    '{"suggestions": [{"key": string, "value": string, "why": string}]}',
    '- key is one of:',
    '  "kind": value "person", or "general" for a business, an organisation or an automated sender.',
    '  "relation": who this person is to them, in a few words ("sister", "manager at Acme", "landlord").',
    '  "birthday": YYYY-MM-DD, or MM-DD when the year is not said.',
    '  "sex": "female", "male" or "other".',
    '  "what": what a general contact is ("bank", "school", "delivery service").',
    '  "website": the address of a general contact.',
    '  "detail:<Label>": another way to reach them or a labelled fact, such as "detail:Phone" or "detail:Works at".',
    '  "note": one short sentence about them worth remembering.',
    '- why: a few words quoting or pointing at the message that shows it.',
    `- At most ${ContactProfilePrompt.MAX_PROPOSALS} suggestions. Never repeat what is already recorded. Never guess from the name alone, and leave out anything the messages do not state.`,
  ].join('\n');

  static messages(contact, material) {
    const appears = [...new Set((contact.identities || []).map((i) => `${i.app}: ${i.display || i.handle}`))].join('; ');
    const user = [
      `Contact: ${contact.name} (recorded as a ${contact.kind === 'person' ? 'person' : 'general contact'})`,
      `Appears as: ${appears || 'unknown'}`,
      `Already recorded: ${contact.about || 'nothing'}`,
      `Messages from them (${material.messages.length}, newest first):`,
      ...material.messages.map((m) => `- ${String(m.at || '').slice(0, 10)} ${m.app}: ${ModelText.clip(m.text, ContactProfilePrompt.MESSAGE_CHARS)}`),
      ...material.conversations.map((text) => ContactProfilePrompt._conversation(text)),
    ].join('\n');
    return [{ role: 'system', content: ContactProfilePrompt.SYSTEM }, { role: 'user', content: user }];
  }

  static parse(text) {
    const raw = ModelText.json(text);
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.suggestions)) return null;
    return raw.suggestions
      .map((s) => ({ key: String((s && s.key) || '').trim(), value: ModelText.clip(s && s.value, ContactProfilePrompt.VALUE_CHARS), why: ModelText.clip(s && s.why, ContactProfilePrompt.VALUE_CHARS) }))
      .filter((s) => s.key && s.value)
      .slice(0, ContactProfilePrompt.MAX_PROPOSALS);
  }

  static _conversation(text) {
    const whole = String(text || '').trim();
    const tail = whole.length > ContactProfilePrompt.CONVERSATION_CHARS ? `[...] ${whole.slice(whole.length - ContactProfilePrompt.CONVERSATION_CHARS)}` : whole;
    return `Conversation as read from their screen:\n${tail.split(/\r?\n/).filter((line) => line.trim()).map((line) => `    ${line}`).join('\n')}`;
  }
}

module.exports = ContactProfilePrompt;
