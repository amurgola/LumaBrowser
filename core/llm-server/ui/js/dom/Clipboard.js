export default class Clipboard {
  static copyText(text) {
    return new Promise((resolve) => {
      const fallback = () => resolve(Clipboard._copyWithSelection(text));
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => resolve(true), fallback);
      } else {
        fallback();
      }
    });
  }

  static _copyWithSelection(text) {
    const textarea = Clipboard._hiddenTextarea(text);
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    document.body.removeChild(textarea);
    return ok;
  }

  static _hiddenTextarea(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    return textarea;
  }
}
