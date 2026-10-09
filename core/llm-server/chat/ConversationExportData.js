class ConversationExportData {
  static build({ conversation, messages, artifacts, getArtifact }) {
    const conv = conversation || {};
    return {
      success: true,
      mode: 'export',
      exportedAt: new Date().toISOString(),
      conversation: {
        title: conv.title || 'Conversation',
        createdAt: conv.createdAt || null,
        updatedAt: conv.updatedAt || null,
      },
      messages: ConversationExportData._asList(messages).map((m) => ConversationExportData._message(m, getArtifact)),
      artifacts: ConversationExportData._asList(artifacts).map((a) => ({
        id: a.id, title: a.title, type: a.type, language: a.language || null,
      })),
    };
  }

  static _message(m, getArtifact) {
    return {
      id: m.id,
      role: m.role,
      content: m.content || '',
      error: m.error || null,
      createdAt: m.createdAt || null,
      artifacts: ConversationExportData._artifactRefs(m.toolCalls && m.toolCalls.artifacts, getArtifact),
    };
  }

  static _artifactRefs(list, getArtifact) {
    const seen = new Set();
    const refs = [];
    for (const a of ConversationExportData._asList(list)) {
      if (!a || !a.id || seen.has(a.id)) continue;
      seen.add(a.id);
      refs.push(ConversationExportData._artifactRef(a, getArtifact));
    }
    return refs;
  }

  static _artifactRef(a, getArtifact) {
    const ref = { id: a.id, title: a.title || 'Artifact', type: a.type || 'html' };
    const rawUrl = ConversationExportData._inlineMediaUrl(a.id, getArtifact);
    if (rawUrl) ref.rawUrl = rawUrl;
    return ref;
  }

  static _inlineMediaUrl(id, getArtifact) {
    const art = ConversationExportData._lookup(id, getArtifact);
    if (!art || (art.type !== 'image' && art.type !== 'video')) return null;
    const content = String(art.content || '');
    if (!content) return null;
    const mime = art.language || (art.type === 'video' ? 'video/mp4' : 'image/png');
    return `data:${mime};base64,${content}`;
  }

  static _lookup(id, getArtifact) {
    try {
      return typeof getArtifact === 'function' ? getArtifact(id) : null;
    } catch (_) {
      return null;
    }
  }

  static _asList(value) {
    return Array.isArray(value) ? value : [];
  }
}

module.exports = ConversationExportData;
