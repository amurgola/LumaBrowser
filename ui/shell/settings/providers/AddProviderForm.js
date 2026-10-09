import PeerDiscovery from './PeerDiscovery.js';

export default class AddProviderForm {
  static ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

  constructor(ctx) {
    this._ctx = ctx;
    const $ = (id) => document.getElementById(id);
    this._el = {
      addBtn: $('addProviderBtn'), form: $('addProviderForm'), saveBtn: $('saveNewProviderBtn'), cancelBtn: $('cancelNewProviderBtn'),
      type: $('newProviderType'), endpoint: $('newProviderEndpoint'), name: $('newProviderName'), apiKey: $('newProviderApiKey'),
      nameGroup: $('newProviderNameGroup'), endpointGroup: $('newProviderEndpointGroup'), keyGroup: $('newProviderApiKeyGroup'),
      peerBlock: $('newProviderPeerBlock'), peerAddr: $('newPeerAddress'), peerPin: $('newPeerPin'), peerMsg: $('newPeerMsg'),
    };
    this._discovery = new PeerDiscovery({ el: $('newPeerDiscovered'), onPick: (addr) => this._pickPeer(addr) });
  }

  install() {
    const el = this._el;
    if (!el.addBtn || !el.form) return;
    this._discovery.install();
    el.addBtn.onclick = () => { el.form.classList.remove('ext-hidden'); el.addBtn.classList.add('ext-hidden'); this._setMode(el.type.value); };
    el.cancelBtn.onclick = () => this._cancel();
    el.type.onchange = () => {
      el.endpoint.value = el.type.value === 'anthropic' ? AddProviderForm.ANTHROPIC_ENDPOINT : '';
      this._setMode(el.type.value);
    };
    el.saveBtn.onclick = () => this._submit();
  }

  static newConfig(type, name, endpoint, apiKey, now = Date.now()) {
    return {
      id: 'provider_' + now + '_' + Math.random().toString(36).substr(2, 6),
      type, name, endpoint, apiKey,
      selectedModel: null,
      models: [],
    };
  }

  _setMode(type) {
    const el = this._el;
    const isPeer = type === 'peer';
    if (el.nameGroup) el.nameGroup.classList.toggle('ext-hidden', isPeer);
    if (el.endpointGroup) el.endpointGroup.classList.toggle('ext-hidden', isPeer);
    if (el.keyGroup) el.keyGroup.classList.toggle('ext-hidden', isPeer);
    if (el.peerBlock) el.peerBlock.classList.toggle('ext-hidden', !isPeer);
    el.saveBtn.textContent = isPeer ? 'Pair' : 'Save Provider';
    if (isPeer) this._discovery.start(); else this._discovery.stop();
  }

  _cancel() {
    this._closeForm();
    this._discovery.stop();
    this._resetPeerFields();
  }

  _closeForm() {
    this._el.form.classList.add('ext-hidden');
    this._el.addBtn.classList.remove('ext-hidden');
  }

  _resetPeerFields() {
    const el = this._el;
    if (el.peerAddr) el.peerAddr.value = '';
    if (el.peerPin) el.peerPin.value = '';
    if (el.peerMsg) el.peerMsg.textContent = '';
    this._discovery.clear();
  }

  _pickPeer(address) {
    this._el.peerAddr.value = address;
    this._el.peerPin.focus();
  }

  async _submit() {
    const type = this._el.type.value;
    if (!type) { this._ctx.feedback.markSaved(this._el.type, false, 'Select a provider type first'); return; }
    if (type === 'peer') await this._pair();
    else await this._addProvider(type);
  }

  async _pair() {
    const el = this._el;
    const addr = (el.peerAddr.value || '').trim();
    const pin = (el.peerPin.value || '').trim();
    if (!addr || !pin) { el.peerMsg.textContent = 'Enter the host address and its PIN.'; return; }
    el.peerMsg.textContent = 'Pairing...';
    el.saveBtn.disabled = true;
    let r = null;
    try { r = await window.sharingAPI.pair(addr, pin); } catch (e) { r = { success: false, error: e && e.message }; }
    el.saveBtn.disabled = false;
    if (!r || !r.success) { el.peerMsg.textContent = (r && r.error) || 'Pairing failed.'; return; }
    el.type.value = '';
    this._closeForm();
    this._discovery.stop();
    this._resetPeerFields();
    this._setMode('');
    this._ctx.log.add(`Paired with "${r.peer ? r.peer.name : addr}"`, 'success');
    document.dispatchEvent(new CustomEvent('sharing:peers-changed'));
    await this._finish();
  }

  async _addProvider(type) {
    const el = this._el;
    const name = el.name.value.trim();
    const endpoint = el.endpoint.value.trim();
    const apiKey = el.apiKey.value.trim();
    if (!name) { this._ctx.feedback.markSaved(el.name, false, 'Enter a name for this provider'); return; }
    if (!endpoint) { this._ctx.feedback.markSaved(el.endpoint, false, 'Enter the API endpoint'); return; }
    await this._ctx.list.add(AddProviderForm.newConfig(type, name, endpoint, apiKey));
    el.type.value = '';
    el.name.value = '';
    el.endpoint.value = '';
    el.apiKey.value = '';
    this._closeForm();
    this._setMode('');
    this._ctx.log.add(`Provider "${name}" added`, 'success');
    await this._finish();
  }

  async _finish() {
    this._ctx.pingChat();
    await this._ctx.list.render();
  }
}
