export default class MarkdownInline {
  static render(text) {
    return text
      .replace(/`([^`]+)`/g, (_, code) => '<code>' + code + '</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/!\[([^\]]*)\]\((https:[^)\s]+)\)/g,
        '<img class="cm-md-img" src="$2" alt="$1" referrerpolicy="no-referrer" loading="lazy" decoding="async"/>')
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
}
