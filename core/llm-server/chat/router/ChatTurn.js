const ChatModelRef = require('./ChatModelRef');
const ChatStyleDocs = require('./ChatStyleDocs');
const DocsSourceGrant = require('./DocsSourceGrant');
const MessageImages = require('./MessageImages');
const TurnStream = require('./TurnStream');

class ChatTurn {
  constructor(deps) {
    this._d = deps;
    this._args = null;
    this._modelRef = null;
    this._temperature = undefined;
    this._agentMode = false;
    this._docsGrant = null;
    this._convId = null;
    this._mode = { descriptor: null, turn: null };
    this._stream = null;
  }

  async run(args) {
    const invalid = ChatTurn._validate(args);
    if (invalid) return invalid;
    this._setup(args);
    this._supersedePrevious();
    const opened = this._openConversation();
    if (opened.error) return { success: false, error: opened.error };
    const { choicesOn, userRow, userArtifacts, images } = this._persistUserSide();
    let runMessages = await this._applyMode();
    const asst = this._addPlaceholder();
    if (!asst) return { success: false, error: 'Message to regenerate was not found.' };
    this._announce(asst, userRow, userArtifacts);
    this._openStream(asst);
    runMessages = await this._d.compaction.maybeCompact(runMessages, this._modelRef, this._mode.turn, this._stream.hooks, this._convId);
    runMessages = this._withStyleDocs(runMessages, choicesOn);
    runMessages = await this._withDocsSource(runMessages);
    return this._dispatch(asst, runMessages, images, choicesOn);
  }

  static _validate(args) {
    if (!Array.isArray(args.messages) || args.messages.length === 0) return { success: false, error: 'messages is required' };
    if (!args.modelRef) return { success: false, error: 'modelRef is required' };
    return null;
  }

  _setup(args) {
    this._args = args;
    this._modelRef = args.modelRef;
    this._agentMode = !!args.agent;
    this._temperature = args.temperature;
    this._docsGrant = DocsSourceGrant.forTurn(this._d.getDocs ? this._d.getDocs() : null, args.docsSource);
  }

  _supersedePrevious() {
    this._d.inFlight.abort();
    this._d.reclaimer.cancelPending();
  }

  _openConversation() {
    const a = this._args;
    const opened = this._d.conversation.open({
      conversationId: a.conversationId,
      regenerateMessageId: a.regenerateMessageId,
      editMessageId: a.editMessageId,
      userMessage: a.userMessage,
      messages: a.messages,
      modelRef: this._modelRef,
      agentMode: this._agentMode,
      disabledTools: a.disabledTools,
      choicesEnabled: a.choicesEnabled,
    });
    if (opened.convId) this._convId = opened.convId;
    return opened;
  }

  _persistUserSide() {
    const a = this._args;
    const conversation = this._d.conversation;
    conversation.syncTools(this._convId, this._agentMode);
    conversation.rememberDocsSource(this._convId, a.docsSource);
    const choicesOn = conversation.resolveChoices(this._convId, a.choicesEnabled);
    const images = MessageImages.imagesOf(a.attachments);
    const userRow = conversation.addUserMessage(this._convId, a.userMessage, this._modelRef, !!a.regenerateMessageId, a.editMessageId);
    const userArtifacts = this._d.attachments.persist(images, this._convId, userRow);
    conversation.rememberModel(this._convId, this._modelRef);
    return { choicesOn, userRow, userArtifacts, images };
  }

  async _applyMode() {
    this._mode = await this._d.modes.resolve({ conversationId: this._convId, messages: this._args.messages, modelRef: this._modelRef });
    const turn = this._mode.turn;
    if (!turn) return this._args.messages;
    if (turn.agent && !this._agentMode) {
      this._agentMode = true;
      this._d.conversation.syncTools(this._convId, true);
    }
    if (typeof turn.temperature === 'number' && this._temperature == null) this._temperature = turn.temperature;
    if (turn.modelRef && typeof turn.modelRef === 'string' && turn.modelRef !== this._modelRef) {
      this._modelRef = turn.modelRef;
      this._d.conversation.pinModel(this._convId, this._modelRef);
    }
    if (turn.systemPrompt && !this._agentMode) return [{ role: 'system', content: String(turn.systemPrompt) }, ...this._args.messages];
    return this._args.messages;
  }

  _addPlaceholder() {
    const store = this._d.chatStore;
    let variant = { group: null, createdAt: null, parentId: undefined };
    if (this._args.regenerateMessageId) {
      const v = store.startVariant(this._args.regenerateMessageId);
      if (!v) return null;
      variant = { group: v.group, createdAt: v.createdAt, parentId: v.parentId };
    }
    return store.addMessage({
      conversationId: this._convId,
      role: 'assistant',
      content: '',
      reasoning: '',
      modelRef: this._modelRef,
      provider: ChatModelRef.providerTag(this._modelRef),
      variantGroup: variant.group,
      variantActive: 1,
      createdAt: variant.createdAt,
      parentId: variant.parentId,
    });
  }

  _announce(asst, userRow, userArtifacts) {
    this._args.send('meta', {
      conversationId: this._convId,
      assistantMessageId: asst.id,
      userMessageId: userRow ? userRow.id : undefined,
      userArtifacts: userArtifacts.length ? userArtifacts : undefined,
    });
  }

  _openStream(asst) {
    const { send } = this._args;
    const descriptor = this._mode.descriptor;
    this._stream = new TurnStream({
      chatStore: this._d.chatStore,
      send,
      conversationId: this._convId,
      assistantMessageId: asst.id,
      contextWindow: this._d.contextWindow.forRef(this._modelRef),
      onSettled: () => this._d.inFlight.clear(),
      react: (content, aborted) => this._d.reaction.run(descriptor, {
        content, conversationId: this._convId, assistantMessageId: asst.id, send, aborted,
      }),
    });
  }

  _withStyleDocs(messages, choicesOn) {
    if (this._agentMode) return messages;
    let out = messages;
    if (!this._mode.turn && this._args.voice !== true) out = ChatStyleDocs.appendToSystemHead(out, ChatStyleDocs.WIDGETS);
    if (choicesOn) out = ChatStyleDocs.appendToSystemHead(out, ChatStyleDocs.CHOICES);
    if (this._args.voice === true) out = ChatStyleDocs.appendToSystemHead(out, ChatStyleDocs.VOICE);
    return out;
  }

  async _withDocsSource(messages) {
    if (this._agentMode || !this._docsGrant) return messages;
    try {
      return await this._docsGrant.prepass(messages);
    } catch (_) {
      return messages;
    }
  }

  async _dispatch(asst, messages, images, choicesOn) {
    const a = this._args;
    const dial = this._d.thinking.resolve({
      modelRef: this._modelRef, messages, conversationId: this._convId, noThink: a.noThink,
      reasoningEffort: a.reasoningEffort, agentMode: this._agentMode, evalOverrides: a.evalOverrides || null,
    });
    try {
      const handle = this._agentMode
        ? this._dispatchAgent(asst, dial, images, choicesOn)
        : await this._dispatchPlain(asst, dial, images);
      this._track(handle);
      return { success: true, conversationId: this._convId, assistantMessageId: asst.id };
    } catch (err) {
      const { message, hints } = this._stream.fail(err);
      return { success: false, error: message, ...hints, conversationId: this._convId, assistantMessageId: asst.id };
    }
  }

  _dispatchAgent(asst, dial, images, choicesOn) {
    const a = this._args;
    return this._d.agentDispatch.run({
      modelRef: this._modelRef,
      messages: dial.messages,
      temperature: this._temperature,
      convId: this._convId,
      asstId: asst.id,
      hooks: this._stream.hooks,
      modeTurn: this._mode.turn,
      images,
      llmExtra: dial.agentExtra,
      choicesOn,
      voiceOn: a.voice === true,
      docsGrant: this._docsGrant,
      evalOverrides: a.evalOverrides || null,
      approvalOverride: a.approvalOverride || null,
    });
  }

  _dispatchPlain(asst, dial, images) {
    const trace = { conversationId: this._convId, turnId: asst.id, callType: 'chat' };
    return this._d.dispatcher.dispatch(this._modelRef, dial.messages, this._temperature, this._stream.hooks, images, null,
      { ...(dial.plainExtra || {}), trace });
  }

  _track(handle) {
    if (this._stream.finished) return;
    const stream = this._stream;
    this._d.inFlight.begin({ abort: () => stream.abort(handle) }, ChatModelRef.isLocal(this._modelRef));
  }
}

module.exports = ChatTurn;
