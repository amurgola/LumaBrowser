const TriggerSecrets = require('../../core/llm-server/chat/triggers/TriggerSecrets');
const HubSchema = require('./HubSchema');
const HubService = require('./HubService');
const HubBroadcast = require('./HubBroadcast');
const HubIpcHandlers = require('./HubIpcHandlers');
const InboundToken = require('./InboundToken');
const HubSyncScheduler = require('./sync/HubSyncScheduler');
const CalendarSourceRepository = require('./calendar/CalendarSourceRepository');
const CalendarEventRepository = require('./calendar/CalendarEventRepository');
const CalendarService = require('./calendar/CalendarService');
const IcsCalendarProvider = require('./calendar/providers/IcsCalendarProvider');
const GoogleCalendarProvider = require('./calendar/providers/GoogleCalendarProvider');
const MicrosoftCalendarProvider = require('./calendar/providers/MicrosoftCalendarProvider');
const GoogleSessionCalendarProvider = require('./calendar/providers/GoogleSessionCalendarProvider');
const SessionCookies = require('./calendar/session/SessionCookies');
const OAuthFlow = require('./calendar/oauth/OAuthFlow');
const OAuthTokens = require('./calendar/oauth/OAuthTokens');
const NotificationRepository = require('./inbox/NotificationRepository');
const ThreadRepository = require('./inbox/ThreadRepository');
const InboxService = require('./inbox/InboxService');
const BoardColumnRepository = require('./board/BoardColumnRepository');
const TaskSourceRepository = require('./board/TaskSourceRepository');
const TaskRepository = require('./board/TaskRepository');
const TaskMessageRepository = require('./board/TaskMessageRepository');
const BoardService = require('./board/BoardService');
const ClickUpTaskProvider = require('./board/ClickUpTaskProvider');
const MicrosoftSessionCalendarProvider = require('./calendar/providers/MicrosoftSessionCalendarProvider');
const SessionTabs = require('./connections/SessionTabs');
const GoogleAccounts = require('./connections/GoogleAccounts');
const MicrosoftAccounts = require('./connections/MicrosoftAccounts');
const ConnectionMonitor = require('./connections/ConnectionMonitor');
const AccountCalendars = require('./connections/AccountCalendars');
const DesktopAlert = require('./connections/DesktopAlert');

class PersonalHubExtension {
  static OAUTH_CALLBACK_PATH = '/api/hub/oauth/callback';
  static QUEUE_PATH = '/api/hub/queue';
  static ENRICH_PATH = '/api/hub/threads/enrich';
  static DEFAULT_BASE_URL = 'http://127.0.0.1:3000';

  constructor(overrides = {}) {
    this._overrides = overrides;
    this._scheduler = null;
    this._monitor = null;
    this._unsubscribeIngest = null;
    this._api = null;
    this._gatewayBaseUrl = null;
  }

  async activate(context) {
    HubSchema.ensure(context.db);
    const parts = this._buildServices(context);
    this._subscribeNotifications(context, parts.inbox);
    HubIpcHandlers.register(context.ipc, this._buildApi(parts), { openUrl: (url) => this._openUrl(context, url) });
    this._scheduler.start();
    this._monitor.start();
    return this._api;
  }

  async deactivate() {
    if (this._scheduler) this._scheduler.stop();
    if (this._monitor) this._monitor.stop();
    if (this._unsubscribeIngest) { try { this._unsubscribeIngest(); } catch (_) {} }
    this._scheduler = null;
    this._monitor = null;
    this._unsubscribeIngest = null;
    this._api = null;
  }

  getApi() {
    return this._api;
  }

  _buildServices(context) {
    const db = context.db;
    const broadcast = this._overrides.broadcast || new HubBroadcast();
    const emit = broadcast.emitter();
    const secrets = this._overrides.secrets || new TriggerSecrets(db.getRawDb());
    const fetchImpl = this._overrides.fetchImpl || null;
    const now = this._overrides.now || (() => new Date());
    const calendarSources = new CalendarSourceRepository(db);
    const taskSources = new TaskSourceRepository(db);
    const tokens = new OAuthTokens({ secrets, fetchImpl });
    const tabs = new SessionTabs({ browser: context.browser || null, getCookies: this._overrides.getCookies || SessionCookies.reader() });
    const google = new GoogleAccounts({ tabs, fetchImpl });
    const microsoft = new MicrosoftAccounts({ tabs, fetchImpl, sleep: this._overrides.sleep || null });
    const calendar = new CalendarService({
      sources: calendarSources,
      events: new CalendarEventRepository(db),
      secrets,
      tokens,
      oauth: new OAuthFlow({ tokens, fetchImpl }),
      providers: this._calendarProviders({ microsoft }),
      emit,
      getRedirectUri: () => this._baseUrl() + PersonalHubExtension.OAUTH_CALLBACK_PATH,
      fetchImpl,
    });
    const inbox = new InboxService({
      notifications: new NotificationRepository(db),
      threads: new ThreadRepository(db),
      emit,
      now,
    });
    const board = new BoardService({
      columns: new BoardColumnRepository(db),
      tasks: new TaskRepository(db),
      messages: new TaskMessageRepository(db),
      sources: taskSources,
      secrets,
      providers: { clickup: new ClickUpTaskProvider() },
      emit,
      fetchImpl,
      now,
    });
    this._scheduler = new HubSyncScheduler({ calendarSources, taskSources, calendar, board, emit, now });
    this._monitor = new ConnectionMonitor({
      tabs, google, microsoft, emit, now,
      listCalendarSources: () => calendar.listSources(),
      listTaskSources: () => board.listSources(),
      alert: this._overrides.alert || new DesktopAlert(),
    });
    const connections = { monitor: this._monitor, accounts: new AccountCalendars({ monitor: this._monitor, calendar }), tabs };
    const inbound = new InboundToken(db);
    const service = new HubService({ calendar, inbox, board, sync: this._scheduler, inbound, connections, now, openUrl: (url) => this._openUrl(context, url) });
    return { service, inbox, inbound };
  }

  _calendarProviders({ microsoft }) {
    const ics = new IcsCalendarProvider();
    return {
      ics,
      google: new GoogleCalendarProvider(),
      microsoft: new MicrosoftCalendarProvider(),
      'google-session': new GoogleSessionCalendarProvider({ getCookies: this._overrides.getCookies || SessionCookies.reader(), icsProvider: ics }),
      'microsoft-session': new MicrosoftSessionCalendarProvider({ getToken: (partition) => microsoft.token(partition, { reload: false }) }),
    };
  }

  _subscribeNotifications(context, inbox) {
    const interceptor = context.extensions && context.extensions['notification-interceptor'];
    if (!interceptor || typeof interceptor.onIngest !== 'function') return;
    this._unsubscribeIngest = interceptor.onIngest(({ notification }) => {
      try { inbox.ingest(notification); } catch (err) { console.error('personal-hub: ingest failed:', err.message); }
    });
  }

  _buildApi({ service, inbound }) {
    const api = {};
    for (const name of PersonalHubExtension._methodNames(service)) api[name] = (...args) => service[name](...args);
    api.inboundToken = () => inbound;
    api.inboundInfo = () => this._inboundInfo(inbound);
    api.setGatewayBaseUrl = (url) => { this._gatewayBaseUrl = String(url || '').replace(/\/+$/, '') || null; };
    api.getGatewayBaseUrl = () => this._baseUrl();
    this._api = api;
    return api;
  }

  _inboundInfo(inbound) {
    const base = this._baseUrl();
    return {
      token: inbound.get(),
      baseUrl: base,
      queueUrl: base + PersonalHubExtension.QUEUE_PATH,
      enrichUrl: base + PersonalHubExtension.ENRICH_PATH,
      oauthCallbackUrl: base + PersonalHubExtension.OAUTH_CALLBACK_PATH,
    };
  }

  _baseUrl() {
    return this._gatewayBaseUrl || PersonalHubExtension.DEFAULT_BASE_URL;
  }

  async _openUrl(context, url) {
    const browser = context.browser;
    if (!browser || typeof browser.createTab !== 'function') return { success: false, error: 'The browser is not available.' };
    try {
      await browser.createTab(String(url), { kind: 'user' });
      return { success: true };
    } catch (err) {
      return { success: false, error: (err && err.message) || String(err) };
    }
  }

  static _methodNames(service) {
    return Object.getOwnPropertyNames(Object.getPrototypeOf(service))
      .filter((name) => name !== 'constructor' && !name.startsWith('_') && typeof service[name] === 'function');
  }
}

module.exports = PersonalHubExtension;
