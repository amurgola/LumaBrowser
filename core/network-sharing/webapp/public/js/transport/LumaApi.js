import PairingToken from './PairingToken.js';
import HostHttp from './HostHttp.js';
import HostApi from './HostApi.js';
import ChatStream from './ChatStream.js';
import ImageStream from './ImageStream.js';
import VoiceApi from './VoiceApi.js';
import Unauthorized from './Unauthorized.js';

export default class LumaApi {
  static PUBLIC_METHODS = ['getToken', 'setToken', 'getHostName', 'setHostName', 'info', 'pair', 'listModels',
    'hostCapabilities', 'chat', 'generateImage', 'fetchArtifact', 'listAgents', 'listChatModes', 'authedFetch',
    'voiceStatus', 'voicePrewarm', 'voiceTranscribe', 'voiceSynthesize'];

  constructor({ win = window, fetch = null, storage = null, cryptoImpl = null } = {}) {
    this.Unauthorized = Unauthorized;
    this._token = new PairingToken({ storage: storage || win.localStorage, doc: win.document });
    this._http = new HostHttp({ fetch: fetch || win.fetch.bind(win), token: this._token, win });
    this._host = new HostApi({ http: this._http, token: this._token, userAgent: (win.navigator && win.navigator.userAgent) || '' });
    this._chat = new ChatStream(this._http, { cryptoImpl: cryptoImpl || win.crypto });
    this._image = new ImageStream(this._http);
    this._voice = new VoiceApi(this._http);
    this._token.syncCookie();
    for (const name of LumaApi.PUBLIC_METHODS) this[name] = this[name].bind(this);
  }

  getToken() { return this._token.get(); }

  setToken(token) { this._token.set(token); }

  getHostName() { return this._token.hostName(); }

  setHostName(name) { this._token.setHostName(name); }

  info() { return this._host.info(); }

  pair(pin) { return this._host.pair(pin); }

  listModels() { return this._host.listModels(); }

  hostCapabilities() { return this._host.hostCapabilities(); }

  listAgents() { return this._host.listAgents(); }

  listChatModes() { return this._host.listChatModes(); }

  fetchArtifact(id) { return this._host.fetchArtifact(id); }

  chat(opts) { return this._chat.run(opts); }

  generateImage(opts) { return this._image.generate(opts); }

  authedFetch(input, init) { return this._http.authed(input, init); }

  voiceStatus() { return this._voice.status(); }

  voicePrewarm() { return this._voice.prewarm(); }

  voiceTranscribe(wav, opts) { return this._voice.transcribe(wav, opts); }

  voiceSynthesize(opts) { return this._voice.synthesize(opts); }
}
