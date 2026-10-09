export default class AiTextCleaner {
  static clean(text) {
    let s = String(text || '');
    s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/^\s*```[a-z]*\s*\n?/i, '').replace(/```\s*$/, '');
    s = s.trim().replace(/^["'`]+/, '').replace(/["'`]+$/, '');
    return s.trim();
  }

  static firstLine(text, maxChars) {
    return AiTextCleaner.clean(text).split('\n')[0].slice(0, maxChars);
  }
}
