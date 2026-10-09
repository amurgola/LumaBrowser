export default class WizardStepView {
  constructor(wizard) {
    this._w = wizard;
  }

  enter() {
    this.render();
  }

  render() {
    throw new Error(`${this.constructor.name} must implement render()`);
  }

  get _state() {
    return this._w.state;
  }

  get _body() {
    return this._w.bodyEl;
  }

  _isCurrent(stepId) {
    return this._w.currentStepId() === stepId;
  }
}
