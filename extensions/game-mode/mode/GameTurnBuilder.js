const ImageModelPins = require('../assets/ImageModelPins');
const GameKind = require('../session/GameKind');
const GameKnowledgeBase = require('../GameKnowledgeBase');
const GameSystemPrompt = require('../prompts/GameSystemPrompt');
const PixelPost = require('../pixel/PixelPost');
const ReadBudget = require('../tools/project/ReadBudget');
const GameProjectTools = require('../tools/project/GameProjectTools');
const GameAssetTools = require('../tools/assets/GameAssetTools');
const GameToolScope = require('../tools/GameToolScope');
const TestAiPromptTool = require('../tools/TestAiPromptTool');

class GameTurnBuilder {
  static TEMPERATURE = 0.4;
  static AGENT_BUDGET = { maxIterations: 40, noTimeout: true, reasoningCharsPerStep: 1e9, reasoningCharsTotal: 1e9 };
  static EXTRA_ALLOWED = ['validate_code', 'search_knowledge_base'];

  constructor({ context, sessions, folders, gatewayInfo, aiSurface }) {
    this._context = context;
    this._sessions = sessions;
    this._folders = folders;
    this._gatewayInfo = gatewayInfo;
    this._aiSurface = aiSurface;
  }

  build({ meta, conversationId, modelRef = null }) {
    const data = (meta && meta.data) || {};
    const tools = this._canBuild(data) ? this._tools(data, conversationId, modelRef) : null;
    const imageReady = this._imageReady();
    return {
      systemPrompt: GameSystemPrompt.build(data, {
        hasTools: !!tools,
        imageReady,
        artStyle: data.artStyle,
        models: ImageModelPins.resolve(data),
        alpha: imageReady && PixelPost.available(),
      }),
      temperature: GameTurnBuilder.TEMPERATURE,
      agent: !!tools,
      tools,
      allowedTools: tools ? [...tools.map((t) => t.name), ...GameTurnBuilder.EXTRA_ALLOWED] : null,
      noBrowser: true,
      agentBudget: tools ? { ...GameTurnBuilder.AGENT_BUDGET } : null,
      kbScope: GameKnowledgeBase.SCOPE,
      modelRef,
    };
  }

  _canBuild(data) {
    const hasPremise = !!(data.premise && String(data.premise).trim());
    return !!(this._context && this._context.code) && hasPremise;
  }

  _tools(data, conversationId, modelRef) {
    this._resetWholeReads(conversationId);
    const kind = GameKind.normalize(data.kind);
    const scopeFields = { context: this._context, conversationId, sessions: this._sessions, gameDir: this._folders.gameDirFor(conversationId), name: data.name, kind };
    const { truncator, wholeFileMaxBytes, ctxPerSlot } = ReadBudget.compute();
    return [
      ...GameProjectTools.build({ ...scopeFields, truncator, wholeFileMaxBytes, ctxPerSlot }),
      ...GameAssetTools.build({
        ...scopeFields,
        kbCacheDir: this._folders.kbCacheDir,
        artStyle: data.artStyle || null,
        imageModelRef: ImageModelPins.resolve(data),
        modelRef,
        gatewayInfo: this._gatewayInfo,
      }),
      ...(kind === GameKind.AI ? [this._aiPromptTool(scopeFields)] : []),
    ];
  }

  _resetWholeReads(conversationId) {
    const existing = this._sessions.get(conversationId);
    if (existing && existing.readWhole) existing.readWhole.clear();
  }

  _aiPromptTool(scopeFields) {
    const scope = new GameToolScope(scopeFields);
    return new TestAiPromptTool(scope, {
      bridge: this._aiSurface.bridge,
      framing: () => this._aiSurface.framingFor(scopeFields.conversationId),
    }).toDefinition();
  }

  _imageReady() {
    const chat = this._context && this._context.chat;
    try { return !!(chat && chat.isImageReady && chat.isImageReady()); } catch (_) { return false; }
  }
}

module.exports = GameTurnBuilder;
