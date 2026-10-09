class GroupIntent {
  static PATTERNS = {
    live_artifacts: /\b(interactiv\w*|live (?:app|widget|demo|module|tool)|play(?:able|\s+with|\s+around)|widget|calculator|to-?do|todo|checklist|kanban|game|simulat\w+|slider|counter|stop\s?watch|timer|mini[-\s]?app|playground|clickable|drag[-\s]?and[-\s]?drop|that i can (?:play|use|interact))\b/i,
    images: /\b(image|picture|photo(?:graph)?|draw|illustrat\w+|\blogo\b|\bicon\b|render(?:ing)?|wallpaper|artwork|art of|portrait|sketch|paint|generate (?:an?\s+)?(?:image|picture|art))\b/i,
    artifacts: /\b(?:write|create|build|make|give me|generate|show me)\b[\s\S]{0,30}?\b(?:code|script|function|class|program|component|css|html(?:\s+page|\s+file)?|web\s?page|markdown|readme|document|spec|snippet|config)\b/i,
    web: /\b(search (?:the )?web|web search|google|look up|latest|current(?:ly)?|today'?s|this (?:week|year)|recent(?:ly)?|news|stock price|weather|https?:\/\/)\b/i,
    knowledge_base: /\b(my (?:docs?|documents?|notes?|files?|pdfs?)|the (?:doc|document|pdf|file|paper|report)\s+i\s+(?:uploaded|added|shared)|in (?:the|my) (?:doc|document|pdf|notes?|knowledge ?base)|knowledge ?base|uploaded (?:doc|document|file|pdf))\b/i,
    tool_forge: /\b(?:create|build|make|write|add|forge)\b[\s\S]{0,30}?\b(?:custom |new |chat |another )?tool\b/i,
  };

  static infer(text, availableKeys) {
    const s = String(text || '');
    if (!s.trim()) return [];
    return Object.keys(GroupIntent.PATTERNS)
      .filter((key) => availableKeys.has(key) && GroupIntent.PATTERNS[key].test(s));
  }
}

module.exports = GroupIntent;
