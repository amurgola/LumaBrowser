const express = require('express');
const SharedImageJob = require('../media/SharedImageJob');
const SharedVoice = require('../media/SharedVoice');
const VoiceSynthesisStream = require('../media/VoiceSynthesisStream');
const RouteReply = require('./RouteReply');

class MediaRoutes {
  static AUDIO_TYPES = ['audio/wav', 'audio/wave', 'audio/x-wav', 'application/octet-stream'];
  static AUDIO_LIMIT = '25mb';

  constructor(service, auth) {
    this._service = service;
    this._auth = auth;
    this._voice = new SharedVoice(service);
  }

  mount(router) {
    this._mountImage(router);
    this._mountVoice(router);
  }

  _mountImage(router) {
    const requireToken = this._auth.requireToken;
    router.post('/image/generate', requireToken, (req, res) => new SharedImageJob(this._service, SharedImageJob.GENERATE_ROLE).run(req, res));
    router.post('/image/edit', requireToken, (req, res) => new SharedImageJob(this._service, SharedImageJob.EDIT_ROLE).run(req, res));
  }

  _mountVoice(router) {
    const guards = [this._auth.requireToken, (req, res, next) => this._requireVoiceShare(req, res, next)];
    const rawAudio = express.raw({ type: MediaRoutes.AUDIO_TYPES, limit: MediaRoutes.AUDIO_LIMIT });
    router.get('/voice/status', this._auth.requireToken, (req, res) => res.json(this._voice.status()));
    router.post('/voice/prewarm', ...guards, async (req, res) => res.json(await this._voice.prewarm()));
    router.post('/voice/transcribe', ...guards, rawAudio, async (req, res) => RouteReply.send(res, await this._voice.transcribe(req)));
    router.post('/voice/synthesize', ...guards, (req, res) => new VoiceSynthesisStream(this._service).run(req, res));
  }

  _requireVoiceShare(req, res, next) {
    const refusal = this._voice.gate();
    return refusal ? RouteReply.send(res, refusal) : next();
  }
}

module.exports = MediaRoutes;
