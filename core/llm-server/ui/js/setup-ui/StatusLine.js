export default class StatusLine {
  static for(element, baseClass) {
    return (cls, text) => {
      if (!element) return;
      element.className = baseClass + (cls ? ' ' + cls : '');
      element.textContent = text;
    };
  }
}
