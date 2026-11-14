export default class OpenEndpointDetails {
  constructor() {
    this._details = new Map();
  }

  open(endpoint, which) {
    this._details.set(endpoint.id, { which, definition: OpenEndpointDetails.definition(endpoint), values: null, result: null });
  }

  close(endpointId) {
    this._details.delete(endpointId);
  }

  ran(endpointId, values, result) {
    const detail = this._details.get(endpointId);
    if (!detail) return;
    detail.values = values;
    detail.result = result;
  }

  restore(endpoint) {
    const detail = this._details.get(endpoint.id);
    if (!detail) return null;
    if (detail.definition !== OpenEndpointDetails.definition(endpoint)) {
      this._details.delete(endpoint.id);
      return null;
    }
    return { which: detail.which, values: detail.values, result: detail.result };
  }

  keepOnly(sites) {
    const present = new Set();
    for (const site of sites) for (const endpoint of site.endpoints || []) present.add(endpoint.id);
    for (const endpointId of [...this._details.keys()]) if (!present.has(endpointId)) this._details.delete(endpointId);
  }

  static definition(endpoint) {
    const { name, params, steps, returns, policy } = endpoint;
    return JSON.stringify({ name, params, steps, returns, policy });
  }
}
