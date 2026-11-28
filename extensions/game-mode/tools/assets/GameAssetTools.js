const GameToolScope = require('../GameToolScope');
const AssetRenderQueue = require('../../assets/AssetRenderQueue');
const GenerateAssetTool = require('./GenerateAssetTool');
const GenerateAssetsTool = require('./GenerateAssetsTool');
const RunGameTool = require('./RunGameTool');
const FetchGamedevDocTool = require('./FetchGamedevDocTool');

class GameAssetTools {
  static build({ kbCacheDir, artStyle = null, imageModelRef = null, palette = null, modelRef = null, gatewayInfo = null, onAssetSettled, queue: givenQueue = null, ...scopeFields }) {
    const scope = new GameToolScope(scopeFields);
    const queue = givenQueue || new AssetRenderQueue({
      chat: scope.chat, conversationId: scope.conversationId, session: () => scope.session(), onSettled: onAssetSettled,
    });
    const images = { artStyle, imageModelRef, palette, queue };
    return [
      new GenerateAssetTool(scope, images),
      new GenerateAssetsTool(scope, images),
      new RunGameTool(scope, { modelRef, gatewayInfo }),
      new FetchGamedevDocTool(scope, { kbCacheDir }),
    ].map((tool) => tool.toDefinition());
  }
}

module.exports = GameAssetTools;
