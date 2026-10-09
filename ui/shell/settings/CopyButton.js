import Clipboard from '../../../core/llm-server/ui/js/dom/Clipboard.js';

export default class CopyButton {
  static FLASH_MS = 1500;

  static async copy(btn, text, flashLabel = 'Copied!') {
    if (!(await Clipboard.copyText(text))) return false;
    const orig = btn.textContent;
    btn.textContent = flashLabel;
    setTimeout(() => { btn.textContent = orig; }, CopyButton.FLASH_MS);
    return true;
  }
}
