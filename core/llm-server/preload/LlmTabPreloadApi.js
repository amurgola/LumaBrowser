const LlmHostApi = require('./LlmHostApi');
const LlmRuntimeApi = require('./LlmRuntimeApi');
const LlmServerApi = require('./LlmServerApi');
const TabPreviewApi = require('./TabPreviewApi');
const ChatTurnApi = require('./ChatTurnApi');
const ConversationApi = require('./ConversationApi');
const ChatTasksApi = require('./ChatTasksApi');
const ChatModesApi = require('./ChatModesApi');
const ArtifactApi = require('./ArtifactApi');
const VoiceApi = require('./VoiceApi');
const GroundingApi = require('./GroundingApi');
const ModelSetupApi = require('./ModelSetupApi');
const ModelTestApi = require('./ModelTestApi');
const ImageApi = require('./ImageApi');
const MusicApi = require('./MusicApi');
const PlacementApi = require('./PlacementApi');
const AppLinksApi = require('./AppLinksApi');

class LlmTabPreloadApi {
  static GLOBAL_NAME = 'llmDiagAPI';

  static SECTIONS = [
    LlmHostApi, LlmRuntimeApi, LlmServerApi, TabPreviewApi, ChatTurnApi, ConversationApi, ChatTasksApi,
    ChatModesApi, ArtifactApi, VoiceApi, GroundingApi, ModelSetupApi, ModelTestApi, ImageApi, MusicApi,
    PlacementApi, AppLinksApi,
  ];

  static expose(contextBridge, ipcRenderer, webUtils) {
    try {
      contextBridge.exposeInMainWorld(LlmTabPreloadApi.GLOBAL_NAME, LlmTabPreloadApi.build(ipcRenderer, webUtils));
    } catch (err) {
      console.error('[llm-tab-preload] failed to expose llmDiagAPI', err);
    }
  }

  static build(ipcRenderer, webUtils) {
    return Object.assign({}, ...LlmTabPreloadApi.SECTIONS.map((Section) => Section.build(ipcRenderer, webUtils)));
  }
}

module.exports = LlmTabPreloadApi;
