class ChatStyleDocs {
  static CHOICES = [
    '<reply_choices>',
    'End every reply with exactly one fenced block offering 3 short replies the user might plausibly send next, phrased in the user\'s own voice:',
    '```choices',
    '["First suggested reply", "Second suggested reply", "Third suggested reply"]',
    '```',
    'Rules:',
    '- The block is the LAST thing in your reply, after your complete answer.',
    '- Exactly 3 options, each under 12 words, plain text only (no numbering or markdown inside the strings).',
    '- Make the three genuinely different: one that digs deeper, one concrete next step, one that changes direction.',
    '- Never mention or explain these choices in your prose; the interface renders them as buttons.',
    '- Never emit this block in a reply that contains a tool call; add it only to a final, user-facing answer.',
    '</reply_choices>',
  ].join('\n');

  static WIDGETS = [
    '<visual_answers>',
    'The chat can draw two widgets from a fenced JSON block. Use one only when it clearly helps: the user asks for a chart, or the answer compares several numbers. Never for one or two values.',
    '```chart',
    '{"type": "bar", "title": "Revenue by quarter", "unit": "$", "labels": ["Q1", "Q2", "Q3"], "series": [{"name": "2025", "data": [12, 18, 15]}]}',
    '```',
    '"type" is "bar" (comparing categories) or "line" (change over time); up to 8 series; numbers only in "data".',
    '```stats',
    '[{"label": "Revenue", "value": "$4.2M", "delta": "+12% vs Q2", "good": true}]',
    '```',
    'Up to 4 headline figures; "good" says whether the change is good news. Write the JSON on its own, with no comments, and still explain the numbers in prose.',
    '</visual_answers>',
  ].join('\n');

  static VOICE = [
    '<voice_mode>',
    'This is a spoken conversation: the user is talking to you, and your reply is read aloud by text-to-speech.',
    'Write for the ear:',
    '- Keep replies to one to three short conversational sentences unless the user explicitly asks for detail.',
    '- Never output tables, bullet lists, headings, code blocks, emoji, or raw URLs. Say site and product names plainly ("Textbookly", not the URL).',
    '- When you use tools, you may open with one short line like "Let me check that.", but NEVER end your reply on that announcement: the tool call must follow in the SAME reply. Saying you will do something without calling the tool does nothing. Between tool steps stay quiet, or use one brief phrase like "Found it, one moment."',
    '- Lead with the answer: the key fact or number first, then at most one sentence of context, then offer more ("Want the full list?" or "Want the link?").',
    '- You may gather rich data with tools, but speak only the part the user asked for.',
    '</voice_mode>',
  ].join('\n');

  static VOICE_REMINDER = [
    '<voice_mode_reminder>',
    'Spoken reply, read aloud by TTS. No headings, bullet lists, tables, code blocks, or raw URLs.',
    'One to three short sentences. Lead with the answer, then offer more.',
    '</voice_mode_reminder>',
  ].join('\n');

  static appendToSystemHead(messages, doc) {
    const head = messages[0];
    if (head && head.role === 'system') {
      return [{ ...head, content: String(head.content || '') + '\n\n' + doc }, ...messages.slice(1)];
    }
    return [{ role: 'system', content: doc }, ...messages];
  }
}

module.exports = ChatStyleDocs;
