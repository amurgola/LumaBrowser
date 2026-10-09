export default class FaviconFallback {
  static apply(root) {
    root.querySelectorAll('img.bookmark-favicon').forEach((img) => {
      img.addEventListener('error', () => FaviconFallback._replace(img));
    });
  }

  static _replace(img) {
    const span = img.ownerDocument.createElement('span');
    span.className = 'bookmark-favicon bd-fallback';
    span.textContent = img.dataset.letter || '?';
    if (img.parentNode) img.parentNode.replaceChild(span, img);
  }
}
