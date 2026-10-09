const ArtifactDataHandler = require('./handlers/ArtifactDataHandler');
const CreateArtifactHandler = require('./handlers/CreateArtifactHandler');
const CreateLiveArtifactHandler = require('./handlers/CreateLiveArtifactHandler');
const EditArtifactHandler = require('./handlers/EditArtifactHandler');
const EditImageHandler = require('./handlers/EditImageHandler');
const GenerateImageHandler = require('./handlers/GenerateImageHandler');
const KnowledgeBaseHandler = require('./handlers/KnowledgeBaseHandler');
const MusicHandler = require('./handlers/MusicHandler');
const ScheduleArtifactUpdatesHandler = require('./handlers/ScheduleArtifactUpdatesHandler');
const SendWebhookHandler = require('./handlers/SendWebhookHandler');
const TakeoverHandler = require('./handlers/TakeoverHandler');
const ValidateCodeHandler = require('./handlers/ValidateCodeHandler');
const VideoHandler = require('./handlers/VideoHandler');
const WebSearchHandler = require('./handlers/WebSearchHandler');

class ChatToolTable {
  static HANDLER_CLASSES = [
    TakeoverHandler, CreateArtifactHandler, CreateLiveArtifactHandler, EditArtifactHandler, WebSearchHandler,
    SendWebhookHandler, KnowledgeBaseHandler, ValidateCodeHandler, ArtifactDataHandler, ScheduleArtifactUpdatesHandler,
    GenerateImageHandler, EditImageHandler, VideoHandler, MusicHandler,
  ];

  constructor(handlers = ChatToolTable.HANDLER_CLASSES.map((Handler) => new Handler())) {
    this._byName = new Map();
    for (const handler of handlers) {
      for (const name of handler.names()) this._byName.set(name, handler);
    }
  }

  handlerFor(name) {
    return this._byName.get(name) || null;
  }

  names() {
    return [...this._byName.keys()];
  }
}

module.exports = ChatToolTable;
