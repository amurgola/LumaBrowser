const path = require('path');
const HistoryService = require('../../core/history/HistoryService');
const BookmarkService = require('../../core/bookmarks/BookmarkService');
const FaviconCache = require('../../core/browser/FaviconCache');
const OpenAICompatibleProvider = require('../../core/llm-service/providers/OpenAICompatibleProvider');
const AnthropicProvider = require('../../core/llm-service/providers/AnthropicProvider');
const NetworkWatcherService = require('../../core/network-watcher/NetworkWatcherService');
const NetworkInterceptor = require('../../core/browser/NetworkInterceptor');
const LLMService = require('../../core/llm-service/LLMService');
const LLMQueueManager = require('../../core/llm-service/LLMQueueManager');
const MachineIdentity = require('../../core/install/MachineIdentity');
const TelemetryConsent = require('../../core/telemetry/TelemetryConsent');
const PulseService = require('../../core/pulse/PulseService');
const ChromeExtensionService = require('../../core/chrome-extensions/ChromeExtensionService');
const AdblockerService = require('../../core/adblocker/AdblockerService');
const ApiSecurity = require('../../core/shell/ApiSecurity');
const ActivityLogStore = require('../../core/activity-log/ActivityLogStore');
const ActivityLogService = require('../../core/activity-log/ActivityLogService');

class FoundationServices {
  static ACTIVITY_LOG_FILE = 'activity-log.db';
  static FAVICON_FILE = 'favicons.json';

  static ACTIVITY_CALLERS = [
    ['core.browser', { label: 'Browser', description: 'Tab navigation + DOM tools' }],
    ['core.llm', { label: 'LLM Service', description: 'LLM provider routing + queue' }],
    ['core.shell', { label: 'Shell', description: 'Extension lifecycle + REST gateway' }],
  ];

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._buildBrowserData();
    this._buildLlmRouting();
    this._buildNetworkWatching();
    this._buildIdentityAndTelemetry();
    this._buildBrowserAddOns();
    this._s.apiSecurity = new ApiSecurity(this._db);
    this._buildActivityLog();
    return this._s;
  }

  _buildBrowserData() {
    this._s.historyService = new HistoryService(this._db);
    this._s.bookmarkService = new BookmarkService(this._db);
    const userData = this._ctx.app.getPath('userData');
    this._s.faviconCache = new FaviconCache({ filePath: path.join(userData, FoundationServices.FAVICON_FILE) });
  }

  _buildLlmRouting() {
    this._s.lmStudioService = new OpenAICompatibleProvider(this._db);
    this._s.anthropicService = new AnthropicProvider(this._db);
    this._s.llmService = new LLMService(this._db, { openai: this._s.lmStudioService, anthropic: this._s.anthropicService });
    this._s.llmQueueManager = new LLMQueueManager();
    this._s.llmService.setQueueManager(this._s.llmQueueManager);
  }

  _buildNetworkWatching() {
    this._s.networkWatcherService = new NetworkWatcherService(this._db);
    this._s.networkInterceptor = new NetworkInterceptor(this._s.networkWatcherService);
  }

  _buildIdentityAndTelemetry() {
    this._s.machineIdentity = new MachineIdentity({ env: this._ctx.env });
    this._s.telemetryConsent = new TelemetryConsent(this._db, { isDev: this._ctx.isDev });
    this._s.pulseService = new PulseService({ identity: this._s.machineIdentity, consent: this._s.telemetryConsent });
  }

  _buildBrowserAddOns() {
    this._s.chromeExtensionService = new ChromeExtensionService(this._db, this._ctx.dataDir);
    this._s.adblockerService = new AdblockerService(this._db, this._ctx.dataDir);
  }

  _buildActivityLog() {
    const store = new ActivityLogStore(path.join(this._ctx.dataDir, FoundationServices.ACTIVITY_LOG_FILE));
    const service = new ActivityLogService(store, this._db);
    for (const [caller, meta] of FoundationServices.ACTIVITY_CALLERS) service.registerCaller(caller, meta);
    this._s.activityLogService = service;
  }
}

module.exports = FoundationServices;
