class ResponseText {
  static extract(response) {
    if (!response) return '';
    if (typeof response === 'string') return response.trim();
    const choiceContent = response.choices?.[0]?.message?.content;
    if (choiceContent !== undefined && choiceContent !== null) {
      const fromChoice = ResponseText._fromChoiceContent(choiceContent);
      if (fromChoice !== null) return fromChoice;
    }
    return ResponseText._firstNonEmpty([
      response.choices?.[0]?.text,
      ResponseText._anthropicBlocks(response.content),
      response.content,
      response.text,
      response.output,
      response.completion,
    ]);
  }

  static _fromChoiceContent(content) {
    if (typeof content === 'string') return content.trim();
    if (!Array.isArray(content)) return null;
    const joined = ResponseText._joinTextBlocks(content).trim();
    return joined || null;
  }

  static _joinTextBlocks(blocks) {
    return blocks
      .filter((block) => block && (block.type === 'text' || typeof block === 'string'))
      .map((block) => (typeof block === 'string' ? block : (block.text || '')))
      .join('');
  }

  static _anthropicBlocks(content) {
    if (!Array.isArray(content)) return null;
    return content
      .filter((block) => block?.type === 'text')
      .map((block) => block.text || '')
      .join('');
  }

  static _firstNonEmpty(candidates) {
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
    return '';
  }
}

module.exports = ResponseText;
