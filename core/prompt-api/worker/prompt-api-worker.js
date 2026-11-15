const { localAIHandler, LanguageModelUtility } = require('electron/utility');
const LocalLanguageModel = require('./LocalLanguageModel');
const ParentRequests = require('./ParentRequests');

const requests = new ParentRequests(process.parentPort);

localAIHandler.setPromptAPIHandler((details) => LocalLanguageModel.define(LanguageModelUtility, {
  requests,
  page: { webContentsId: details.webContentsId, origin: details.securityOrigin },
}));
