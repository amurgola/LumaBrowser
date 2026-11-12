const ReactionScope = require('./ReactionScope');
const TurnJournal = require('../journal/TurnJournal');

class ScopedChat {
  static wrap(chat) {
    if (!chat || typeof chat !== 'object') return chat;
    return new Proxy(chat, {
      get(target, prop) {
        const value = target[prop];
        if (prop === 'complete' && typeof value === 'function') return (opts) => ScopedChat._complete(target, opts);
        if (prop === 'generateImage' && typeof value === 'function') return (opts) => ScopedChat._generate(target, opts);
        return value;
      },
    });
  }

  static async _complete(chat, opts) {
    const scope = ReactionScope.current();
    if (!scope) return chat.complete(opts);
    scope.throwIfStopped();
    const trace = (opts && opts.trace) || { conversationId: scope.conversationId || null, turnId: scope.messageId || null, callType: 'side' };
    const started = Date.now();
    const result = await chat.complete(Object.assign({}, opts, { signal: scope.signal, trace }));
    TurnJournal.shared.side({ conversationId: scope.conversationId, messageId: scope.messageId, opts, result, ms: Date.now() - started });
    scope.throwIfStopped();
    return result;
  }

  static async _generate(chat, opts) {
    const scope = ReactionScope.current();
    if (scope) scope.throwIfStopped();
    return chat.generateImage(opts);
  }
}

module.exports = ScopedChat;
