const LocalApiServer = require('../../core/llm-server/server/LocalApiServer');
const PlacementService = require('../../core/placement/PlacementService');
const AppGlobals = require('../AppGlobals');

class AuxiliaryServices {
  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  build() {
    this._s.localApiServer = AppGlobals.publish('__lumaLocalApiServer', new LocalApiServer({ db: this._s.db, llmServerService: this._s.llmServerService }));
    this._s.placementService = AppGlobals.publish('__lumaPlacementService', new PlacementService({
      settingsDb: this._s.db,
      llmServerService: this._s.llmServerService,
      imageServerService: this._s.imageServerService,
      musicServerService: this._s.musicServerService,
      groundingServerService: this._s.groundingServerService,
      getAgentDeps: () => this._ctx.agentDeps,
    }));
    return this._s;
  }
}

module.exports = AuxiliaryServices;
