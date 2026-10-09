export default class WorkspaceClient {
  constructor() {
    this.api = null;
    this.conversationId = null;
  }

  async call(name, args) {
    const workspace = this.api && this.api.chat && this.api.chat.workspace ? this.api.chat.workspace : null;
    if (!workspace || typeof workspace[name] !== 'function') return { success: false, error: 'File access is unavailable here.' };
    try {
      return await workspace[name]({ conversationId: this.conversationId, ...args });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
