const fs = require('fs');
const os = require('os');
const path = require('path');
const ConversationExportHtml = require('./ConversationExportHtml');

class ConversationExportRenderer {
  static KINDS = new Set(['pdf', 'png']);
  static PNG_MAX_HEIGHT = 16000;
  static WINDOW_HEIGHT = 1200;
  static IMAGE_WAIT_MS = 5000;
  static SETTLE_AFTER_RESIZE_MS = 250;

  constructor({ BrowserWindow } = {}) {
    this._BrowserWindow = BrowserWindow || null;
  }

  static defaultFileName(title, kind) {
    const base = String(title || 'conversation')
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'conversation';
    return `${base}.${kind}`;
  }

  async render(html, kind) {
    if (!ConversationExportRenderer.KINDS.has(kind)) throw new Error(`Unknown export kind: ${kind}`);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-export-'));
    const win = this._openHiddenWindow();
    try {
      await win.loadFile(ConversationExportRenderer._writeDocument(tmpDir, html));
      await ConversationExportRenderer._waitForImages(win);
      return kind === 'pdf'
        ? await ConversationExportRenderer._printPdf(win)
        : await ConversationExportRenderer._capturePng(win);
    } finally {
      ConversationExportRenderer._cleanup(win, tmpDir);
    }
  }

  _openHiddenWindow() {
    const BrowserWindow = this._BrowserWindow || require('electron').BrowserWindow;
    return new BrowserWindow({
      show: false,
      width: ConversationExportHtml.PAGE_WIDTH,
      height: ConversationExportRenderer.WINDOW_HEIGHT,
      useContentSize: true,
      enableLargerThanScreen: true,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    });
  }

  static _writeDocument(tmpDir, html) {
    const file = path.join(tmpDir, 'conversation.html');
    fs.writeFileSync(file, html, 'utf8');
    return file;
  }

  static _waitForImages(win) {
    return win.webContents.executeJavaScript(
      '(function(){'
      + 'var imgs=Array.prototype.slice.call(document.images);'
      + 'imgs.forEach(function(i){ try{ i.loading="eager"; }catch(_){} });'
      + 'var waits=imgs.map(function(i){ return i.complete?null:new Promise(function(r){ i.onload=i.onerror=r; }); }).filter(Boolean);'
      + `return Promise.race([Promise.all(waits), new Promise(function(r){ setTimeout(r, ${ConversationExportRenderer.IMAGE_WAIT_MS}); })]).then(function(){ return true; });`
      + '})()', true);
  }

  static _printPdf(win) {
    return win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0.4, bottom: 0.4, left: 0.3, right: 0.3 },
      preferCSSPageSize: false,
    });
  }

  static async _capturePng(win) {
    const width = ConversationExportHtml.PAGE_WIDTH;
    const height = await ConversationExportRenderer._measureHeight(win);
    win.setContentSize(width, height);
    await new Promise((resolve) => setTimeout(resolve, ConversationExportRenderer.SETTLE_AFTER_RESIZE_MS));
    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height }, { stayHidden: true, stayAwake: true });
    return image.toPNG();
  }

  static async _measureHeight(win) {
    const scrollHeight = await win.webContents.executeJavaScript(
      'Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)', true);
    return Math.max(200, Math.min(ConversationExportRenderer.PNG_MAX_HEIGHT, Math.ceil(Number(scrollHeight) || 0) + 1));
  }

  static _cleanup(win, tmpDir) {
    try { if (!win.isDestroyed()) win.destroy(); } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = ConversationExportRenderer;
