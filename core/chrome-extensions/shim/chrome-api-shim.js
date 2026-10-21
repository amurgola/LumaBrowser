(function (root) {
  const chrome = root.chrome;
  if (!chrome || chrome.__lumaShim) return;

  function makeEvent(listeners = new Set()) {
    return {
      addListener(fn) { if (typeof fn === 'function') listeners.add(fn); },
      removeListener(fn) { listeners.delete(fn); },
      hasListener(fn) { return listeners.has(fn); },
      hasListeners() { return listeners.size > 0; },
      getRules(...args) { const cb = args.pop(); if (typeof cb === 'function') cb([]); },
      addRules() {},
      removeRules() {},
    };
  }

  function clone(value) {
    return value && typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
  }

  function answer(value) {
    return function (...args) {
      const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const result = typeof value === 'function' ? value(...args) : clone(value);
      if (callback) { callback(result); return undefined; }
      return Promise.resolve(result);
    };
  }

  function remote(bridge, ns, op) {
    return function (...args) {
      const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const promise = bridge.call(ns, op, args);
      if (!callback) return promise;
      promise.then((result) => callback(result), () => callback(undefined));
      return undefined;
    };
  }

  function setting(value) {
    return { get: answer({ value, levelOfControl: 'not_controllable' }), set: answer(undefined), clear: answer(undefined), onChange: makeEvent() };
  }

  function storageArea() {
    const data = new Map();
    const pick = (keys) => {
      if (keys == null) return Object.fromEntries(data);
      if (typeof keys === 'string') return data.has(keys) ? { [keys]: clone(data.get(keys)) } : {};
      if (Array.isArray(keys)) return Object.fromEntries(keys.filter((k) => data.has(k)).map((k) => [k, clone(data.get(k))]));
      return Object.fromEntries(Object.entries(keys).map(([k, fallback]) => [k, data.has(k) ? clone(data.get(k)) : fallback]));
    };
    return {
      get: answer(pick),
      getKeys: answer(() => [...data.keys()]),
      set: answer((items) => { for (const [k, v] of Object.entries(items || {})) data.set(k, clone(v)); }),
      remove: answer((keys) => { for (const k of [].concat(keys || [])) data.delete(k); }),
      clear: answer(() => data.clear()),
      getBytesInUse: answer(0),
      setAccessLevel: answer(undefined),
      onChanged: makeEvent(),
    };
  }

  function deadPort(name) {
    return { name: typeof name === 'string' ? name : '', onMessage: makeEvent(), onDisconnect: makeEvent(), postMessage() {}, disconnect() {} };
  }

  const WINDOW = { id: 1, focused: true, incognito: false, type: 'normal', state: 'normal', alwaysOnTop: false, top: 0, left: 0, width: 1280, height: 800 };
  const TAB = { id: -1, index: 0, windowId: 1, active: true, highlighted: true, pinned: false, incognito: false, selected: true, discarded: false, autoDiscardable: true, url: '', title: '', status: 'complete' };
  let nextId = 1;

  const CONTEXT_TYPE = { ALL: 'all', PAGE: 'page', FRAME: 'frame', SELECTION: 'selection', LINK: 'link', EDITABLE: 'editable', IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', LAUNCHER: 'launcher', BROWSER_ACTION: 'browser_action', PAGE_ACTION: 'page_action', ACTION: 'action' };
  const ITEM_TYPE = { NORMAL: 'normal', CHECKBOX: 'checkbox', RADIO: 'radio', SEPARATOR: 'separator' };
  const WEB_NAVIGATION_EVENTS = ['onBeforeNavigate', 'onCommitted', 'onDOMContentLoaded', 'onCompleted', 'onErrorOccurred', 'onCreatedNavigationTarget', 'onReferenceFragmentUpdated', 'onTabReplaced', 'onHistoryStateUpdated'];

  function bridged(bridge) {
    const live = new Map();
    const liveEvent = (key) => {
      const listeners = new Set();
      live.set(key, listeners);
      return makeEvent(listeners);
    };
    bridge.onEvent((message) => {
      const listeners = message && live.get(`${message.ns}.${message.name}`);
      if (!listeners) return;
      for (const fn of [...listeners]) {
        try { fn(...(message.args || [])); } catch (err) { console.error(`[luma-shim] ${message.ns}.${message.name} listener failed:`, err); }
      }
    });
    const webNavigation = Object.fromEntries(WEB_NAVIGATION_EVENTS.map((name) => [name, liveEvent(`webNavigation.${name}`)]));
    webNavigation.getFrame = remote(bridge, 'webNavigation', 'getFrame');
    webNavigation.getAllFrames = remote(bridge, 'webNavigation', 'getAllFrames');
    const contextMenus = {
      ACTION_MENU_TOP_LEVEL_LIMIT: 6,
      ContextType: CONTEXT_TYPE,
      ItemType: ITEM_TYPE,
      onClicked: liveEvent('contextMenus.onClicked'),
      create(props, callback) {
        const item = { ...(props || {}) };
        if (item.id === undefined || item.id === null) item.id = nextId++;
        const done = () => { if (typeof callback === 'function') callback(); };
        bridge.call('contextMenus', 'create', [item]).then(done, done);
        return item.id;
      },
      update: remote(bridge, 'contextMenus', 'update'),
      remove: remote(bridge, 'contextMenus', 'remove'),
      removeAll: remote(bridge, 'contextMenus', 'removeAll'),
    };
    return { webNavigation, contextMenus };
  }

  function sayHello(bridge) {
    try {
      const manifest = chrome.runtime.getManifest();
      let name = manifest && manifest.name;
      const msg = typeof name === 'string' && /^__MSG_(\w+)__$/.exec(name);
      if (msg && chrome.i18n) name = chrome.i18n.getMessage(msg[1]) || name;
      bridge.call('bridge', 'hello', [{ name: name || chrome.runtime.id, version: manifest && manifest.version }]).catch(() => {});
    } catch (_) {}
  }

  const SPEC = {
    webNavigation: () => ({
      ...Object.fromEntries(WEB_NAVIGATION_EVENTS.map((name) => [name, makeEvent()])),
      getFrame: answer(null), getAllFrames: answer([]),
    }),
    windows: () => ({
      WINDOW_ID_NONE: -1, WINDOW_ID_CURRENT: -2,
      WindowType: { NORMAL: 'normal', POPUP: 'popup', PANEL: 'panel', APP: 'app', DEVTOOLS: 'devtools' },
      WindowState: { NORMAL: 'normal', MINIMIZED: 'minimized', MAXIMIZED: 'maximized', FULLSCREEN: 'fullscreen', LOCKED_FULLSCREEN: 'locked-fullscreen' },
      CreateType: { NORMAL: 'normal', POPUP: 'popup', PANEL: 'panel' },
      onCreated: makeEvent(), onRemoved: makeEvent(), onFocusChanged: makeEvent(), onBoundsChanged: makeEvent(),
      get: answer(WINDOW), getCurrent: answer(WINDOW), getLastFocused: answer(WINDOW), getAll: answer([WINDOW]),
      create: answer(() => ({ ...WINDOW, id: ++nextId })), update: answer(WINDOW), remove: answer(undefined),
    }),
    tabs: () => ({
      TAB_ID_NONE: -1,
      create: answer((props) => ({ ...TAB, id: ++nextId, active: false, url: (props && props.url) || '' })),
      duplicate: answer(undefined), remove: answer(undefined), getCurrent: answer(undefined), getAllInWindow: answer([]),
      getSelected: answer(TAB), highlight: answer(WINDOW), move: answer([]), group: answer(-1), ungroup: answer(undefined),
      discard: answer(undefined), goBack: answer(undefined), goForward: answer(undefined), detectLanguage: answer('und'),
      captureVisibleTab: answer(''), executeScript: answer([]), insertCSS: answer(undefined), removeCSS: answer(undefined),
    }),
    runtime: () => ({
      connectNative: deadPort, sendNativeMessage: answer(undefined), getContexts: answer([]),
      onUserScriptConnect: makeEvent(), onUserScriptMessage: makeEvent(),
    }),
    storage: () => ({ session: storageArea(), managed: storageArea(), sync: storageArea(), onChanged: makeEvent(), AccessLevel: { TRUSTED_CONTEXTS: 'TRUSTED_CONTEXTS', TRUSTED_AND_UNTRUSTED_CONTEXTS: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' } }),
    notifications: () => ({
      TemplateType: { BASIC: 'basic', IMAGE: 'image', LIST: 'list', PROGRESS: 'progress' },
      PermissionLevel: { GRANTED: 'granted', DENIED: 'denied' },
      onClosed: makeEvent(), onClicked: makeEvent(), onButtonClicked: makeEvent(), onPermissionLevelChanged: makeEvent(), onShowSettings: makeEvent(),
      create: answer((idOrOptions) => (typeof idOrOptions === 'string' && idOrOptions ? idOrOptions : `luma-${++nextId}`)),
      update: answer(false), clear: answer(false), getAll: answer({}), getPermissionLevel: answer('denied'),
    }),
    contextMenus: () => ({
      ACTION_MENU_TOP_LEVEL_LIMIT: 6,
      ContextType: CONTEXT_TYPE,
      ItemType: ITEM_TYPE,
      onClicked: makeEvent(),
      create(props, callback) { if (typeof callback === 'function') callback(); return props && props.id != null ? props.id : ++nextId; },
      update: answer(undefined), remove: answer(undefined), removeAll: answer(undefined),
    }),
    privacy: () => ({
      services: {
        alternateErrorPagesEnabled: setting(false), autofillEnabled: setting(false), autofillAddressEnabled: setting(false),
        autofillCreditCardEnabled: setting(false), passwordSavingEnabled: setting(false), safeBrowsingEnabled: setting(false),
        safeBrowsingExtendedReportingEnabled: setting(false), searchSuggestEnabled: setting(false), spellingServiceEnabled: setting(false),
        translationServiceEnabled: setting(false),
      },
      network: { networkPredictionEnabled: setting(false), webRTCIPHandlingPolicy: setting('default') },
      websites: {
        thirdPartyCookiesAllowed: setting(true), topicsEnabled: setting(false), fledgeEnabled: setting(false), adMeasurementEnabled: setting(false),
        hyperlinkAuditingEnabled: setting(false), referrersEnabled: setting(true), doNotTrackEnabled: setting(false),
        protectedContentEnabled: setting(false), relatedWebsiteSetsEnabled: setting(false),
      },
      IPHandlingPolicy: { DEFAULT: 'default', DEFAULT_PUBLIC_AND_PRIVATE_INTERFACES: 'default_public_and_private_interfaces', DEFAULT_PUBLIC_INTERFACE_ONLY: 'default_public_interface_only', DISABLE_NON_PROXIED_UDP: 'disable_non_proxied_udp' },
    }),
    permissions: () => ({
      onAdded: makeEvent(), onRemoved: makeEvent(),
      contains: answer(false), request: answer(false), remove: answer(false), getAll: answer({ permissions: [], origins: [] }),
    }),
    commands: () => ({ onCommand: makeEvent(), getAll: answer([]) }),
    sidePanel: () => ({
      setOptions: answer(undefined), getOptions: answer({ enabled: false }), open: answer(undefined),
      setPanelBehavior: answer(undefined), getPanelBehavior: answer({ openPanelOnActionClick: false }),
    }),
    cookies: () => ({
      SameSiteStatus: { NO_RESTRICTION: 'no_restriction', LAX: 'lax', STRICT: 'strict', UNSPECIFIED: 'unspecified' },
      OnChangedCause: { EVICTED: 'evicted', EXPIRED: 'expired', EXPLICIT: 'explicit', EXPIRED_OVERWRITE: 'expired_overwrite', OVERWRITE: 'overwrite' },
      onChanged: makeEvent(),
      get: answer(null), getAll: answer([]), set: answer(null), remove: answer(null), getAllCookieStores: answer([]), getPartitionKey: answer({}),
    }),
    declarativeNetRequest: () => ({
      MAX_NUMBER_OF_DYNAMIC_RULES: 30000, MAX_NUMBER_OF_SESSION_RULES: 5000, MAX_NUMBER_OF_REGEX_RULES: 1000,
      DYNAMIC_RULESET_ID: '_dynamic', SESSION_RULESET_ID: '_session',
      onRuleMatchedDebug: makeEvent(),
      updateDynamicRules: answer(undefined), getDynamicRules: answer([]), updateSessionRules: answer(undefined), getSessionRules: answer([]),
      updateEnabledRulesets: answer(undefined), getEnabledRulesets: answer([]), updateStaticRules: answer(undefined),
      getAvailableStaticRuleCount: answer(0), getMatchedRules: answer({ rulesMatchedInfo: [] }), isRegexSupported: answer({ isSupported: false }),
      setExtensionActionOptions: answer(undefined), testMatchOutcome: answer({ matchedRules: [] }),
    }),
    userScripts: () => ({
      register: answer(undefined), getScripts: answer([]), unregister: answer(undefined), update: answer(undefined),
      configureWorld: answer(undefined), getWorldConfigurations: answer([]), resetWorldConfiguration: answer(undefined),
    }),
    scripting: () => ({ ExecutionWorld: { ISOLATED: 'ISOLATED', MAIN: 'MAIN' }, registerContentScripts: answer(undefined), unregisterContentScripts: answer(undefined), getRegisteredContentScripts: answer([]), updateContentScripts: answer(undefined) }),
    extension: () => ({ getViews: () => [], getBackgroundPage: () => null, isAllowedIncognitoAccess: answer(false), isAllowedFileSchemeAccess: answer(false), inIncognitoContext: false }),
    browserAction: () => ({
      onClicked: makeEvent(), setBadgeText: answer(undefined), getBadgeText: answer(''), setBadgeBackgroundColor: answer(undefined),
      getBadgeBackgroundColor: answer([0, 0, 0, 0]), setTitle: answer(undefined), getTitle: answer(''), setIcon: answer(undefined),
      setPopup: answer(undefined), getPopup: answer(''), enable: answer(undefined), disable: answer(undefined), openPopup: answer(undefined),
    }),
    downloads: () => ({
      onCreated: makeEvent(), onChanged: makeEvent(), onErased: makeEvent(), onDeterminingFilename: makeEvent(),
      download: answer(-1), search: answer([]), cancel: answer(undefined), erase: answer([]), open() {}, show() {}, showDefaultFolder() {},
    }),
  };

  function isPlain(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value) && typeof value.addListener !== 'function';
  }

  function fill(target, members) {
    for (const [key, value] of Object.entries(members)) {
      try {
        if (!(key in target) || target[key] === undefined) target[key] = value;
        else if (isPlain(target[key]) && isPlain(value)) fill(target[key], value);
      } catch (_) {}
    }
  }

  const bridge = root.lumaShim;
  if (bridge && typeof bridge.call === 'function' && typeof bridge.onEvent === 'function' && chrome.runtime && chrome.runtime.id) {
    try {
      const real = bridged(bridge);
      if (!chrome.webNavigation) chrome.webNavigation = real.webNavigation;
      if (!chrome.contextMenus) chrome.contextMenus = real.contextMenus;
      chrome.__lumaBridge = true;
      sayHello(bridge);
    } catch (err) {
      console.warn('[luma-shim] bridge unusable, falling back to stubs:', err && err.message);
    }
  }

  try {
    if (chrome.storage && chrome.storage.local) {
      Object.defineProperty(chrome.storage, 'sync', { value: chrome.storage.local, configurable: true, enumerable: true, writable: true });
    }
  } catch (_) {}

  for (const [name, build] of Object.entries(SPEC)) {
    try {
      if (!chrome[name]) chrome[name] = {};
      fill(chrome[name], build());
    } catch (_) {}
  }
  try { chrome.__lumaShim = true; } catch (_) {}
})(typeof globalThis !== 'undefined' ? globalThis : self);
