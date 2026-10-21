const ChromeTab = require('./ChromeTab');
const MatchPattern = require('./MatchPattern');

class ChromeContextMenus {
  static DEFAULT_CONTEXTS = ['page'];
  static SELECTION_MAX = 32;
  static MEDIA_CONTEXTS = { image: 'image', video: 'video', audio: 'audio' };

  constructor({ onClick }) {
    this._onClick = onClick;
    this._bySession = new WeakMap();
  }

  setName(sess, extId, name) {
    this._entry(sess, extId).name = typeof name === 'string' && name.trim() ? name.trim() : extId;
  }

  create(sess, extId, props) {
    const item = ChromeContextMenus.normalize(props);
    const entry = this._entry(sess, extId);
    if (entry.items.has(item.id)) throw new Error(`Cannot create item with duplicate id ${item.id}`);
    entry.items.set(item.id, item);
    return item.rawId;
  }

  update(sess, extId, id, props) {
    const item = this._entry(sess, extId).items.get(String(id));
    if (!item) throw new Error(`Cannot find menu item with id ${id}`);
    Object.assign(item, ChromeContextMenus.normalize({ ...item, ...(props || {}), id: item.id }));
  }

  remove(sess, extId, id) {
    const items = this._entry(sess, extId).items;
    const key = String(id);
    if (!items.has(key)) throw new Error(`Cannot find menu item with id ${id}`);
    for (const [childId, child] of [...items]) {
      if (child.parentId === key) this.remove(sess, extId, childId);
    }
    items.delete(key);
  }

  removeAll(sess, extId) {
    this._entry(sess, extId).items.clear();
  }

  list(sess, extId) {
    return [...this._entry(sess, extId).items.values()];
  }

  templateFor({ webContents, params, entry = null, order = null }) {
    const sess = webContents && webContents.session;
    const byExt = sess && this._bySession.get(sess);
    if (!byExt) return [];
    const context = ChromeContextMenus.contextOf(params || {});
    const tab = ChromeTab.fromWebContents(webContents, entry, order);
    const template = [];
    for (const [extId, ext] of byExt) {
      const items = this._visible(ext, null, context);
      if (!items.length) continue;
      const built = items.map((item) => this._menuItem(sess, extId, ext, item, context, tab));
      if (built.length === 1) template.push(built[0]);
      else template.push({ label: ext.name || extId, submenu: built });
    }
    return template;
  }

  _visible(ext, parentId, context) {
    return [...ext.items.values()].filter((item) => item.parentId === parentId && item.visible
      && ChromeContextMenus.contextMatches(item, context)
      && MatchPattern.anyMatch(item.documentUrlPatterns, context.pageUrl)
      && (!item.targetUrlPatterns.length || MatchPattern.anyMatch(item.targetUrlPatterns, context.linkUrl || context.srcUrl || '')));
  }

  _menuItem(sess, extId, ext, item, context, tab) {
    if (item.type === 'separator') return { type: 'separator' };
    const children = this._visible(ext, item.id, context);
    const built = { label: ChromeContextMenus.labelFor(item, context), enabled: item.enabled };
    if (children.length) {
      built.submenu = children.map((child) => this._menuItem(sess, extId, ext, child, context, tab));
      return built;
    }
    if (item.type === 'checkbox' || item.type === 'radio') {
      built.type = item.type;
      built.checked = !!item.checked;
    }
    built.click = () => this._clicked(sess, extId, ext, item, context, tab);
    return built;
  }

  _clicked(sess, extId, ext, item, context, tab) {
    const wasChecked = !!item.checked;
    if (item.type === 'checkbox') item.checked = !wasChecked;
    if (item.type === 'radio') {
      for (const sibling of ext.items.values()) {
        if (sibling.type === 'radio' && sibling.parentId === item.parentId) sibling.checked = sibling === item;
      }
    }
    const info = {
      menuItemId: item.rawId,
      editable: !!context.editable,
      frameId: 0,
      frameUrl: context.pageUrl,
      pageUrl: context.pageUrl,
    };
    if (item.parentId !== null) info.parentMenuItemId = ext.items.get(item.parentId) ? ext.items.get(item.parentId).rawId : item.parentId;
    if (context.linkUrl) info.linkUrl = context.linkUrl;
    if (context.srcUrl) info.srcUrl = context.srcUrl;
    if (context.mediaType) info.mediaType = context.mediaType;
    if (context.selectionText) info.selectionText = context.selectionText;
    if (item.type === 'checkbox' || item.type === 'radio') {
      info.checked = !!item.checked;
      info.wasChecked = wasChecked;
    }
    this._onClick(sess, extId, info, tab);
  }

  static contextOf(params) {
    const selectionText = String(params.selectionText || '').trim();
    const mediaType = ChromeContextMenus.MEDIA_CONTEXTS[params.mediaType] || null;
    const contexts = new Set(['page']);
    if (selectionText) contexts.add('selection');
    if (params.linkURL) contexts.add('link');
    if (params.isEditable) contexts.add('editable');
    if (mediaType) contexts.add(mediaType);
    if (params.frameURL && params.pageURL && params.frameURL !== params.pageURL) contexts.add('frame');
    return {
      contexts,
      selectionText,
      mediaType,
      editable: !!params.isEditable,
      linkUrl: params.linkURL || '',
      srcUrl: params.srcURL || '',
      pageUrl: params.pageURL || '',
    };
  }

  static contextMatches(item, context) {
    return item.contexts.includes('all') || item.contexts.some((c) => context.contexts.has(c));
  }

  static labelFor(item, context) {
    const selection = ChromeContextMenus.truncate(context.selectionText);
    return String(item.title || '').replace(/%s/g, selection);
  }

  static truncate(text, max = ChromeContextMenus.SELECTION_MAX) {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max - 1)}...` : flat;
  }

  static normalize(props) {
    const p = props || {};
    const rawId = p.rawId !== undefined ? p.rawId : (p.id !== undefined && p.id !== null ? p.id : null);
    const contexts = Array.isArray(p.contexts) && p.contexts.length ? p.contexts.map(String) : ChromeContextMenus.DEFAULT_CONTEXTS;
    return {
      id: String(rawId),
      rawId,
      parentId: p.parentId === undefined || p.parentId === null ? null : String(p.parentId),
      type: ['normal', 'checkbox', 'radio', 'separator'].includes(p.type) ? p.type : 'normal',
      title: typeof p.title === 'string' ? p.title : '',
      contexts,
      enabled: p.enabled !== false,
      visible: p.visible !== false,
      checked: !!p.checked,
      documentUrlPatterns: Array.isArray(p.documentUrlPatterns) ? p.documentUrlPatterns : [],
      targetUrlPatterns: Array.isArray(p.targetUrlPatterns) ? p.targetUrlPatterns : [],
    };
  }

  _entry(sess, extId) {
    let byExt = this._bySession.get(sess);
    if (!byExt) { byExt = new Map(); this._bySession.set(sess, byExt); }
    if (!byExt.has(extId)) byExt.set(extId, { name: extId, items: new Map() });
    return byExt.get(extId);
  }
}

module.exports = ChromeContextMenus;
