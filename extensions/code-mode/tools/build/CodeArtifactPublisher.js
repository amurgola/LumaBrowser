class CodeArtifactPublisher {
  static LANGUAGES = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    json: 'json', css: 'css', html: 'html', htm: 'html', md: 'markdown',
  };

  static languageFor(relPath) {
    const ext = String(relPath || '').split('.').pop().toLowerCase();
    return CodeArtifactPublisher.LANGUAGES[ext] || 'text';
  }

  static publish(opts, s, relPath, content) {
    const store = opts && opts.deps && opts.deps.artifactStore;
    if (!store || typeof store.create !== 'function') return;
    try {
      if (!s.artifacts) s.artifacts = new Map();
      CodeArtifactPublisher._dropPrevious(opts, store, s.artifacts.get(relPath));
      const artifact = CodeArtifactPublisher._create(opts, store, relPath, content);
      s.artifacts.set(relPath, artifact.id);
      if (Array.isArray(opts.artifacts)) opts.artifacts.push(artifact);
      if (typeof opts.onArtifact === 'function') opts.onArtifact(artifact);
    } catch (_) {}
  }

  static _dropPrevious(opts, store, previousId) {
    if (!previousId) return;
    if (Array.isArray(opts.artifacts)) {
      const i = opts.artifacts.findIndex((a) => a && a.id === previousId);
      if (i >= 0) opts.artifacts.splice(i, 1);
    }
    if (typeof store.delete === 'function') {
      try { store.delete(previousId); } catch (_) {}
    }
  }

  static _create(opts, store, relPath, content) {
    return store.create({
      conversationId: opts.conversationId,
      messageId: opts.assistantMessageId,
      title: relPath,
      type: 'code',
      language: CodeArtifactPublisher.languageFor(relPath),
      content: content == null ? '' : String(content),
    });
  }
}

module.exports = CodeArtifactPublisher;
