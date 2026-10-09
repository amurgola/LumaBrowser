const { clipboard, shell } = require('electron');
const SearchEngines = require('../../browser/SearchEngines');

class ContextMenuTemplate {
  static SEPARATOR = Object.freeze({ type: 'separator' });
  static SEARCH_LABEL_MAX = 32;

  constructor({ webContents, params, tab, db }) {
    this._webContents = webContents;
    this._params = params || {};
    this._tab = tab;
    this._db = db;
    this._items = [];
  }

  build() {
    this._readTarget();
    this._addNavigation();
    this._addLink();
    this._addImage();
    this._addEditing();
    this._addSearch();
    this._addInspect();
    return ContextMenuTemplate.cleanSeparators(this._items);
  }

  static cleanSeparators(items) {
    const cleaned = [];
    for (const item of items) {
      const last = cleaned[cleaned.length - 1];
      if (item.type === 'separator' && (!last || last.type === 'separator')) continue;
      cleaned.push(item);
    }
    while (cleaned.length && cleaned[cleaned.length - 1].type === 'separator') cleaned.pop();
    return cleaned;
  }

  static truncate(text, max = ContextMenuTemplate.SEARCH_LABEL_MAX) {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max - 1)}...` : flat;
  }

  _readTarget() {
    const p = this._params;
    this._editFlags = p.editFlags || {};
    this._selection = (p.selectionText || '').trim();
    this._hasSelection = this._selection.length > 0;
    this._isEditable = !!p.isEditable;
    this._isLink = !!(p.linkURL && p.linkURL.trim());
    this._isImage = p.mediaType === 'image';
    this._imageUrl = p.srcURL || '';
    this._saveUrl = this._imageUrl || p.recoveredSrcURL || '';
    this._isBrowsingPage = this._tab.isTabPage && !this._tab.isInternal;
  }

  _push(...items) {
    this._items.push(...items);
  }

  _addNavigation() {
    if (!this._isBrowsingPage || this._isLink || this._isImage || this._isEditable || this._hasSelection) return;
    const tab = this._tab;
    this._push(
      { label: 'Back', enabled: tab.canGoBack, click: () => tab.goBack() },
      { label: 'Forward', enabled: tab.canGoForward, click: () => tab.goForward() },
      { label: 'Reload', click: () => tab.reload() },
      ContextMenuTemplate.SEPARATOR,
    );
  }

  _addLink() {
    if (!this._isLink) return;
    const url = this._params.linkURL;
    if (this._tab.isTabPage) this._push({ label: 'Open link in new tab', click: () => this._tab.openInNewTab(url, false) });
    this._push(
      { label: 'Open link in default browser', click: () => { shell.openExternal(url).catch(() => {}); } },
      { label: 'Copy link address', click: () => clipboard.writeText(url) },
      ContextMenuTemplate.SEPARATOR,
    );
  }

  _addImage() {
    if (!this._isImage) return;
    const { x, y } = this._params;
    const wc = this._webContents;
    if (this._tab.isTabPage && this._imageUrl) {
      this._push({ label: 'Open image in new tab', click: () => this._tab.openInNewTab(this._imageUrl, false) });
    }
    this._push({ label: 'Copy image', click: () => ContextMenuTemplate._quietly(() => wc.copyImageAt(x, y)) });
    if (this._imageUrl) this._push({ label: 'Copy image address', click: () => clipboard.writeText(this._imageUrl) });
    if (this._saveUrl) this._push({ label: 'Save image as', click: () => ContextMenuTemplate._quietly(() => wc.downloadURL(this._saveUrl)) });
    this._push(ContextMenuTemplate.SEPARATOR);
  }

  _addEditing() {
    const flags = this._editFlags;
    if (this._isEditable) this._push(...ContextMenuTemplate._editableItems(flags));
    else if (this._hasSelection) this._push(...ContextMenuTemplate._selectionItems(flags));
    else if (flags.canSelectAll && !this._isLink && !this._isImage) this._push({ role: 'selectAll' });
  }

  static _editableItems(flags) {
    return [
      { role: 'undo', enabled: !!flags.canUndo },
      { role: 'redo', enabled: !!flags.canRedo },
      ContextMenuTemplate.SEPARATOR,
      { role: 'cut', enabled: !!flags.canCut },
      { role: 'copy', enabled: !!flags.canCopy },
      { role: 'paste', enabled: !!flags.canPaste },
      { role: 'pasteAndMatchStyle', enabled: !!flags.canPaste },
      { role: 'delete', enabled: !!flags.canDelete },
      ContextMenuTemplate.SEPARATOR,
      { role: 'selectAll', enabled: !!flags.canSelectAll },
    ];
  }

  static _selectionItems(flags) {
    return flags.canSelectAll ? [{ role: 'copy' }, { role: 'selectAll' }] : [{ role: 'copy' }];
  }

  _addSearch() {
    if (!this._hasSelection || !this._tab.isTabPage) return;
    const engineId = SearchEngines.currentId(this._db);
    const engine = SearchEngines.byId(engineId);
    const query = this._selection;
    this._push(ContextMenuTemplate.SEPARATOR, {
      label: `Search ${engine.name} for "${ContextMenuTemplate.truncate(query)}"`,
      click: () => this._tab.openInNewTab(SearchEngines.urlFor(engineId, query), true),
    });
  }

  _addInspect() {
    if (!this._isBrowsingPage) return;
    const { x, y } = this._params;
    const wc = this._webContents;
    this._push(ContextMenuTemplate.SEPARATOR, {
      label: 'Inspect element',
      click: () => {
        ContextMenuTemplate._quietly(() => wc.inspectElement(x, y));
        ContextMenuTemplate._quietly(() => { if (wc.isDevToolsOpened() && wc.devToolsWebContents) wc.devToolsWebContents.focus(); });
      },
    });
  }

  static _quietly(action) {
    try { action(); } catch {}
  }
}

module.exports = ContextMenuTemplate;
