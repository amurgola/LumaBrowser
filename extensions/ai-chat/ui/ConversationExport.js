export default class ConversationExport {
  static LIST_LIMIT = 500;

  static async download(api) {
    const conversations = await ConversationExport.collect(api);
    ConversationExport._save(conversations);
    return conversations;
  }

  static async collect(api) {
    const list = await api.conv.list({ limit: ConversationExport.LIST_LIMIT });
    const conversations = (list && list.conversations) || [];
    const withMessages = [];
    for (const conv of conversations) {
      const r = await api.conv.messages(conv.id);
      withMessages.push({ ...conv, messages: (r && r.messages) || [] });
    }
    return withMessages;
  }

  static fileName(now = new Date()) {
    return `ai-chat-export-${now.toISOString().slice(0, 10)}.json`;
  }

  static _save(conversations) {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ConversationExport.fileName();
    a.click();
    URL.revokeObjectURL(url);
  }
}
