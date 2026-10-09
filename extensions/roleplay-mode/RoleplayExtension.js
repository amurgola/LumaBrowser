const CoreRequire = require('./CoreRequire');
const HostGlobals = require('./HostGlobals');
const RoleplayModeDescriptor = require('./mode/RoleplayModeDescriptor');
const RoleplayIpcHandlers = require('./mode/RoleplayIpcHandlers');
const RoleplayDebug = require('./mode/RoleplayDebug');
const LabFlag = require('./mode/LabFlag');
const RoleplayPostProcessor = require('./pipeline/RoleplayPostProcessor');
const LabService = require('./lab/LabService');

class RoleplayExtension {
  static LAB_SERVICE_GLOBAL = '__lumaRpLabService';

  constructor({ requireCore = CoreRequire.require } = {}) {
    this._requireCore = requireCore;
    this._labService = null;
  }

  async activate(context) {
    const { chat, logger } = context;
    const mode = RoleplayModeDescriptor.build(chat, new RoleplayPostProcessor(chat, logger));
    chat.registerMode(mode);
    const labFlag = new LabFlag(RoleplayExtension._rawDb(context), context.setupTab || null);
    new RoleplayIpcHandlers(context.ipc, new RoleplayDebug(chat), labFlag).register();
    labFlag.apply(labFlag.enabled());
    this._publishLab(mode, chat);
    return {};
  }

  async deactivate() {
    if (this._labService && global[RoleplayExtension.LAB_SERVICE_GLOBAL] === this._labService) {
      global[RoleplayExtension.LAB_SERVICE_GLOBAL] = null;
    }
    this._labService = null;
  }

  _publishLab(mode, chat) {
    this._labService = new LabService({
      mode,
      generateImage: (opts) => chat.generateImage(opts),
      Harness: this._requireCore('roleplay-lab/LabHarness'),
      imageDefaults: () => RoleplayExtension._imageDefaults(),
      chatStore: () => RoleplayExtension._chatStore(),
    });
    global[RoleplayExtension.LAB_SERVICE_GLOBAL] = this._labService;
  }

  static _rawDb(context) {
    return context.db && typeof context.db.getRawDb === 'function' ? context.db.getRawDb() : null;
  }

  static _imageDefaults() {
    const svc = HostGlobals.imageServerService();
    return svc && typeof svc.getDefaults === 'function' ? svc.getDefaults() : null;
  }

  static _chatStore() {
    const router = HostGlobals.chatRouter();
    return (router && router.chatStore) || null;
  }
}

module.exports = RoleplayExtension;
