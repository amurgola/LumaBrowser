const PromptConversation = require('./PromptConversation');

class LocalLanguageModel {
  static define(Base, { requests, page }) {
    return class LocalModel extends Base {
      constructor(conversation) {
        super({ contextUsage: conversation.usage(), contextWindow: PromptConversation.CONTEXT_WINDOW });
        this._conversation = conversation;
      }

      static async create(options) {
        await requests.send('access', page);
        return new LocalModel(PromptConversation.fromInitialPrompts(options && options.initialPrompts));
      }

      static availability() {
        return requests.send('availability', page);
      }

      async prompt(input) {
        const answer = await requests.send('prompt', { ...page, messages: this._conversation.withInput(input) });
        this._conversation.record(input, answer);
        this.contextUsage = this._conversation.usage();
        return answer;
      }

      async append(input) {
        this._conversation.append(input);
        this.contextUsage = this._conversation.usage();
      }

      async measureContextUsage(input) {
        return PromptConversation.estimateTokens(PromptConversation.toChatMessages(input));
      }

      async clone() {
        return new LocalModel(this._conversation.clone());
      }

      destroy() {}
    };
  }
}

module.exports = LocalLanguageModel;
