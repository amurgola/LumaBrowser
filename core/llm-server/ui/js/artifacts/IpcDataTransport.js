import ArtifactDataTransport from './ArtifactDataTransport.js';

export default class IpcDataTransport extends ArtifactDataTransport {
  constructor(api) {
    super();
    this._api = api;
  }

  get canPush() {
    return true;
  }

  all(rootId) {
    return this._api.all(rootId);
  }

  mutate(rootId, ops) {
    return this._api.mutate(rootId, ops);
  }

  subscribe(rootId, onDirty) {
    return this._api.onChanged((payload) => {
      if (payload && payload.rootId === rootId) onDirty(payload.rev);
    });
  }
}
