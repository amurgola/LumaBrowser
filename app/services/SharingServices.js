const SharingHostService = require('../../core/network-sharing/host/SharingHostService');
const SharingClientService = require('../../core/network-sharing/client/SharingClientService');
const SharingRouter = require('../../core/network-sharing/host/routes/SharingRouter');
const WebAppServer = require('../../core/network-sharing/webapp/WebAppServer');
const TlsSharingServer = require('../../core/network-sharing/host/TlsSharingServer');
const RpcLendingService = require('../../core/network-sharing/host/RpcLendingService');
const AppGlobals = require('../AppGlobals');
const SharingNotices = require('../sharing/SharingNotices');
const SharingPorts = require('../sharing/SharingPorts');

class SharingServices {
  static PROVIDERS_CHANGED_CHANNEL = 'core.llmServer.serverEvent';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
    this._db = ctx.services.db;
  }

  build() {
    this._s.sharingNotices = new SharingNotices({ notifyModelStatus: (m, t) => this._ctx.notifyModelStatus(m, t), notice: this._ctx.desktopNotice });
    this._buildHost();
    this._attachListeners();
    this._buildClient();
    this._s.restGateway.getApp().use('/sharing', SharingRouter.create(this._s.sharingHostService));
    this._s.sharingPorts = new SharingPorts({ getApiPort: () => this._ctx.apiPort, hostService: this._s.sharingHostService, rpcLending: this._s.rpcLendingService });
    AppGlobals.publish('__lumaSharingHostService', this._s.sharingHostService);
    AppGlobals.publish('__lumaSharingClientService', this._s.sharingClientService);
    return this._s;
  }

  _buildHost() {
    this._s.sharingHostService = new SharingHostService({
      db: this._db,
      getPort: () => this._ctx.apiPort,
      llmServerService: this._s.llmServerService,
      imageServerService: this._s.imageServerService,
      voiceServices: { stt: this._s.whisperServerService, tts: this._s.ttsServerService },
      notifier: this._s.sharingNotices.newClientNotifier(),
      mcpAggregator: this._s.mcpAggregator,
      apiSecurity: this._s.apiSecurity,
    });
  }

  _attachListeners() {
    const host = this._s.sharingHostService;
    this._s.sharingWebServer = new WebAppServer({ hostService: host });
    host.setWebServer(this._s.sharingWebServer);
    this._s.sharingWebServer.setHooksRouter(this._s.hooksRouter);
    this._s.sharingTlsServer = new TlsSharingServer({ hostService: host });
    host.setTlsServer(this._s.sharingTlsServer);
    this._s.rpcLendingService = AppGlobals.publish('__lumaRpcLending', new RpcLendingService({ db: this._db, llmServerService: this._s.llmServerService }));
    host.setRpcLending(this._s.rpcLendingService);
  }

  _buildClient() {
    this._s.sharingClientService = new SharingClientService({
      db: this._db,
      imageServerService: this._s.imageServerService,
      hostService: this._s.sharingHostService,
      onResourcesChanged: () => this._ctx.renderers.send(SharingServices.PROVIDERS_CHANGED_CHANNEL, { type: 'providers-changed', payload: {} }),
    });
  }
}

module.exports = SharingServices;
