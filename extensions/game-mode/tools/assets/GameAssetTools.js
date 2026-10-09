const GameToolScope = require('../GameToolScope');
const GenerateAssetTool = require('./GenerateAssetTool');
const GenerateAssetsTool = require('./GenerateAssetsTool');
const RunGameTool = require('./RunGameTool');
const FetchGamedevDocTool = require('./FetchGamedevDocTool');

class GameAssetTools {
  static build({ kbCacheDir, artStyle = null, imageModelRef = null, modelRef = null, gatewayInfo = null, ...scopeFields }) {
    const scope = new GameToolScope(scopeFields);
    const images = { artStyle, imageModelRef };
    return [
      new GenerateAssetTool(scope, images),
      new GenerateAssetsTool(scope, images),
      new RunGameTool(scope, { modelRef, gatewayInfo }),
      new FetchGamedevDocTool(scope, { kbCacheDir }),
    ].map((tool) => tool.toDefinition());
  }
}

module.exports = GameAssetTools;
