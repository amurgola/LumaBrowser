class SharedConversationView {
  static DEFAULT_TITLE = 'Conversation';
  static DEFAULT_ARTIFACT_TITLE = 'Artifact';
  static DEFAULT_ARTIFACT_TYPE = 'html';

  static build(conversation, messages, artifacts) {
    return {
      success: true,
      conversation: SharedConversationView._conversation(conversation),
      messages: (messages || []).map(SharedConversationView._message),
      artifacts: (artifacts || []).map(SharedConversationView._artifact),
    };
  }

  static artifactRefs(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const refs = [];
    for (const artifact of list) {
      if (!artifact || !artifact.id || seen.has(artifact.id)) continue;
      seen.add(artifact.id);
      refs.push({
        id: artifact.id,
        title: artifact.title || SharedConversationView.DEFAULT_ARTIFACT_TITLE,
        type: artifact.type || SharedConversationView.DEFAULT_ARTIFACT_TYPE,
      });
    }
    return refs;
  }

  static _conversation(conversation) {
    return {
      title: conversation.title || SharedConversationView.DEFAULT_TITLE,
      createdAt: conversation.createdAt || null,
      updatedAt: conversation.updatedAt || null,
    };
  }

  static _message(message) {
    return {
      id: message.id,
      role: message.role,
      content: message.content || '',
      error: message.error || null,
      createdAt: message.createdAt || null,
      artifacts: SharedConversationView.artifactRefs(message.toolCalls && message.toolCalls.artifacts),
    };
  }

  static _artifact(artifact) {
    return { id: artifact.id, title: artifact.title, type: artifact.type, language: artifact.language || null };
  }
}

module.exports = SharedConversationView;
