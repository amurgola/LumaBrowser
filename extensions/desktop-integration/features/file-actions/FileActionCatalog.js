const DocumentParser = require('../../../../core/rag/DocumentParser');

class FileActionCatalog {
  static IMAGE_MAX = 8 * 1024 * 1024;
  static TEXT_MAX = 200 * 1024;
  static PDF_MAX = 20 * 1024 * 1024;
  static MAX_AGENTS = 10;
  static ASK = 'ask';
  static KB_PREFIX = 'kb-add:';

  static available(items, env, { maxFiles = 10 } = {}) {
    if (!Array.isArray(items) || !items.length) return [];
    const actions = [];
    const single = items.length === 1 ? items[0] : null;
    if (single && single.kind === 'image' && FileActionCatalog._fits(single)) actions.push(...FileActionCatalog._imageActions(env));
    if (single && (single.kind === 'text' || single.kind === 'pdf')) actions.push(...FileActionCatalog._documentActions(single, env));
    if (items.length >= 2 && items.length <= maxFiles && env.canChat() && items.every((it) => FileActionCatalog._attachable(it))) {
      actions.push({ id: 'ask-files', label: 'Ask about these files', group: 'Files', multi: true });
    }
    actions.push(...FileActionCatalog._knowledgeActions(items, env));
    return actions;
  }

  static resolve(id, items, env, options = {}) {
    const list = FileActionCatalog.available(items, env, options);
    const wanted = String(id || '');
    if (wanted === FileActionCatalog.ASK) return list.find((a) => ['ask-image', 'ask-file', 'ask-files'].includes(a.id)) || null;
    return list.find((a) => a.id === wanted) || null;
  }

  static agentIdOf(actionId) {
    const id = String(actionId || '');
    return id.startsWith(FileActionCatalog.KB_PREFIX) ? id.slice(FileActionCatalog.KB_PREFIX.length) : null;
  }

  static isKnowledgeDocument(item) {
    return !!item && item.kind !== 'folder' && DocumentParser.isSupported(item.path || item.name || '') && item.size <= FileActionCatalog.PDF_MAX;
  }

  static _imageActions(env) {
    if (!env.canChat()) return [];
    const out = [
      { id: 'describe-image', label: 'Describe image', group: 'Image', multi: false },
      { id: 'ask-image', label: 'Ask about image', group: 'Image', multi: false },
    ];
    if (env.canEditImages()) out.push({ id: 'edit-image', label: 'Edit with Luma', group: 'Image', multi: false });
    return out;
  }

  static _documentActions(item, env) {
    const out = [];
    if (env.canChat() && FileActionCatalog._fits(item)) {
      out.push({ id: 'summarize', label: 'Summarize', group: 'Document', multi: false });
      out.push({ id: 'ask-file', label: 'Ask about this file', group: 'Document', multi: false });
    }
    if (env.canSpeak() && (item.kind === 'text' || item.size <= FileActionCatalog.PDF_MAX)) {
      out.push({ id: 'read-aloud', label: 'Read aloud', group: 'Document', multi: false });
    }
    return out;
  }

  static _knowledgeActions(items, env) {
    const eligible = items.every((it) => it.kind === 'folder' || FileActionCatalog.isKnowledgeDocument(it));
    if (!eligible) return [];
    const agents = (env.agents() || []).filter((a) => a && a.id).slice(0, FileActionCatalog.MAX_AGENTS);
    return agents.map((a) => ({
      id: FileActionCatalog.KB_PREFIX + a.id,
      label: `Add to ${FileActionCatalog._short(a.name || a.id)} knowledge base`,
      group: 'Knowledge base',
      multi: true,
    }));
  }

  static _fits(item) {
    if (item.kind === 'image') return item.size <= FileActionCatalog.IMAGE_MAX;
    if (item.kind === 'pdf') return item.size <= FileActionCatalog.PDF_MAX;
    if (item.kind === 'text') return item.size <= FileActionCatalog.TEXT_MAX;
    return false;
  }

  static _attachable(item) {
    return ['image', 'pdf', 'text'].includes(item.kind) && FileActionCatalog._fits(item);
  }

  static _short(name) {
    const clean = String(name).replace(/\s+/g, ' ').trim();
    return clean.length > 40 ? `${clean.slice(0, 39)}...` : clean;
  }
}

module.exports = FileActionCatalog;
