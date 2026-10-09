import AiTextCleaner from './AiTextCleaner.js';

export default class MusicAiAssist {
  static STYLE_MAX_CHARS = 300;

  static CONTEXT_CHARS = 800;

  static TIMEOUT_MS = 300000;

  static attach(lyricsEl, styleEl, chatExt, diag) {
    if (!chatExt || !chatExt.attachAssist || !diag || !diag.chat || !diag.chat.complete) return false;
    if (!lyricsEl || !styleEl) return false;
    const current = () => ({ lyrics: (lyricsEl.value || '').trim(), style: (styleEl.value || '').trim() });
    chatExt.attachAssist(lyricsEl, {
      key: 'lyrics',
      assistTitle: 'Draft lyrics with your chat model',
      assist: ({ setStatus }) => { setStatus('Drafting lyrics…'); return MusicAiAssist.lyricsRequest(current()); },
      assistClean: AiTextCleaner.clean,
    }, { api: diag });
    chatExt.attachAssist(styleEl, {
      key: 'style',
      assistTitle: 'Suggest a style with your chat model',
      assist: ({ setStatus }) => { setStatus('Suggesting a style…'); return MusicAiAssist.styleRequest(current()); },
      assistClean: (t) => AiTextCleaner.firstLine(t, MusicAiAssist.STYLE_MAX_CHARS),
    }, { api: diag });
    return true;
  }

  static lyricsRequest({ lyrics, style }) {
    const system = 'You write song lyrics for a music generation model. Reply with ONLY the lyrics: '
      + 'section tags in square brackets like [Intro], [Verse], [Chorus], [Bridge], [Outro], each on its own line, '
      + 'with the sung lines beneath them. Two or three sections is plenty. No title, no commentary, no quotation marks.';
    const parts = ['Write lyrics for a new song.'];
    if (style) parts.push(`The song's style: "${style}". Match its mood and genre.`);
    if (lyrics) parts.push(`The user started with this idea or draft: "${lyrics.slice(0, MusicAiAssist.CONTEXT_CHARS)}". Keep their intent and build it out.`);
    return MusicAiAssist._request(system, parts, 0.9);
  }

  static styleRequest({ lyrics, style }) {
    const system = 'You write style prompts for a music generation model. Reply with ONLY one comma-separated line '
      + '(under 30 words) covering genre, instrumentation, tempo or BPM, mood, and vocal type, like '
      + '"Warm acoustic pop, female vocals, 95 BPM, gentle guitar and strings". No sentences, no preamble, no quotes.';
    const parts = ['Describe the musical style for one song.'];
    if (lyrics) parts.push(`The lyrics so far: "${lyrics.slice(0, MusicAiAssist.CONTEXT_CHARS)}". Match their mood.`);
    if (style) parts.push(`The user asked for something like: "${style}". Refine and build on that.`);
    return MusicAiAssist._request(system, parts, 0.8);
  }

  static _request(system, parts, temperature) {
    return {
      messages: [{ role: 'system', content: system }, { role: 'user', content: parts.join('\n') }],
      temperature, timeoutMs: MusicAiAssist.TIMEOUT_MS, noThink: true,
    };
  }
}
