export default class ChatState {
  constructor() {
    this._initModels();
    this._initNavigation();
    this._initStream();
    this._initComposer();
    this._initModes();
    this._initSessionCaches();
  }

  streamOnScreen() {
    return !!(this.streaming && this.streamMsg && this.messages.includes(this.streamMsg));
  }

  isNewestMessage(m) {
    return this.messages.length > 0 && this.messages[this.messages.length - 1] === m;
  }

  newRequestId() {
    this.reqId = 'req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    return this.reqId;
  }

  resetChatOptions(toolsOn) {
    this.toolsOn = toolsOn;
    this.disabledTools = [];
    this.choicesEnabled = true;
    this.reasoningEffort = null;
    this.docsSource = false;
  }

  enterPlainChat() {
    this.activeMode = 'chat';
    this.activeModeDef = null;
    this.activeMeta = null;
  }

  _initModels() {
    this.models = [];
    this.aiAvailable = true;
    this.aiUnavailableReason = '';
    this.localModels = [];
    this.ctxByRef = {};
    this.defaultRef = null;
    this.modelRef = null;
  }

  _initNavigation() {
    this.conversations = [];
    this.activeId = null;
    this.messages = [];
    this.sidebarExpanded = false;
    this.searchOn = false;
    this.sideMode = 'chats';
    this.newModesOpen = false;
    this.settingsMenuOpen = false;
    this.schedTasks = [];
    this.activeTaskId = null;
    this.triggers = [];
    this.activeTriggerId = null;
    this.panel = null;
    this.shareAvail = false;
    this.debugEnabled = false;
    this.tabPreviewEnabled = true;
  }

  _initStream() {
    this.streaming = false;
    this.streamConvId = null;
    this.reqId = null;
    this.streamMsg = null;
    this.regenActive = false;
    this.autoScrollPaused = false;
    this.firstTurn = false;
    this.lastUsage = null;
  }

  _initComposer() {
    this.toolsOn = true;
    this.disabledTools = [];
    this.choicesEnabled = true;
    this.reasoningEffort = null;
    this.thinkDial = null;
    this.thinkSupported = false;
    this.thinkDefault = 'default';
    this.toolCatalog = null;
    this.attachments = [];
    this.context = [];
    this.tabSuggestion = null;
    this.tabSuggestSkip = new Set();
    this.docsSource = false;
  }

  _initModes() {
    this.activeMode = 'chat';
    this.activeModeDef = null;
    this.activeMeta = null;
    this.modesReady = false;
  }

  _initSessionCaches() {
    this.timingsByMsgId = new Map();
    this.previewByMsgId = new Map();
  }
}
