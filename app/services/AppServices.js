const SettingsBoot = require('./SettingsBoot');
const FoundationServices = require('./FoundationServices');
const ModelServers = require('./ModelServers');
const GatewayServices = require('./GatewayServices');
const ChatTaskServices = require('./ChatTaskServices');
const TriggerServices = require('./TriggerServices');
const ExtensionHost = require('./ExtensionHost');
const SharingServices = require('./SharingServices');
const AuxiliaryServices = require('./AuxiliaryServices');
const ModelStatusNotifier = require('../events/ModelStatusNotifier');

class AppServices {
  constructor(ctx, { log = console } = {}) {
    this._ctx = ctx;
    this._log = log;
  }

  build() {
    const settings = new SettingsBoot({ dataDir: this._ctx.dataDir, log: this._log });
    this._ctx.services.db = settings.open();
    this._buildCore();
    new ExtensionHost(this._ctx).build();
    settings.markMigrated(this._ctx.services.db);
    new SharingServices(this._ctx).build();
    new AuxiliaryServices(this._ctx).build();
    return this._ctx.services;
  }

  _buildCore() {
    new FoundationServices(this._ctx).build();
    new ModelServers(this._ctx).build();
    new ModelStatusNotifier((message, type) => this._ctx.notifyModelStatus(message, type)).watchAll(this._ctx.services);
    new GatewayServices(this._ctx).build();
    new ChatTaskServices(this._ctx).build();
    new TriggerServices(this._ctx).build();
  }
}

module.exports = AppServices;
