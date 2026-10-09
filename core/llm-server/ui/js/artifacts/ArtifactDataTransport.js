export default class ArtifactDataTransport {
  static DEFAULT_POLL_MS = 10000;

  get readOnly() {
    return false;
  }

  get canPush() {
    return false;
  }

  get pollMs() {
    return ArtifactDataTransport.DEFAULT_POLL_MS;
  }

  all(_rootId, _since) {
    throw new Error(`${this.constructor.name} must implement all()`);
  }

  mutate(_rootId, _ops) {
    throw new Error(`${this.constructor.name} must implement mutate()`);
  }

  subscribe(_rootId, _onDirty) {
    throw new Error(`${this.constructor.name} cannot push; check canPush before subscribe()`);
  }
}
