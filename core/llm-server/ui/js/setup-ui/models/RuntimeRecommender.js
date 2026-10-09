import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class RuntimeRecommender {
  constructor(runtimes, hostCaps) {
    this._runtimes = runtimes;
    this._hostCaps = hostCaps;
  }

  recommend(model) {
    const preferred = model.preferredRuntimes || [];
    if (preferred.length > 0) {
      return { id: preferred.find((id) => this._runtimes.isInstalled(id)) || preferred[0], explicit: true };
    }
    const compat = new Set(model.compatibleRuntimes || []);
    const order = this.hostOrder();
    const installed = order.find((id) => compat.has(id) && this._runtimes.isInstalled(id));
    if (installed) return { id: installed, explicit: false };
    const any = order.find((id) => compat.has(id));
    return any ? { id: any, explicit: false } : null;
  }

  hostOrder() {
    const caps = this._hostCaps;
    const order = [];
    if (caps.cudaAvailable) {
      if (caps.cudaMajor() >= 13) order.push('llama-cpp-cuda13');
      order.push('llama-cpp-cuda12');
    }
    if (caps.hasGpu || !caps.cudaAvailable) order.push('llama-cpp-vulkan');
    order.push('llama-cpp-cpu');
    return order;
  }

  tagsHtml(model) {
    const rec = this.recommend(model);
    const tags = (model.formatRequirements || []).map((fmt) => this._formatTag(fmt));
    if (rec) tags.push(this._recommendedTag(rec));
    for (const rid of (model.compatibleRuntimes || [])) {
      if (rec && rec.id === rid) continue;
      if ((model.preferredRuntimes || []).includes(rid)) continue;
      tags.push(this._compatibleTag(rid));
    }
    return tags.join('');
  }

  _formatTag(fmt) {
    const installed = this._runtimes.isInstalled(fmt);
    return `<span class="runtime-tag format" title="Format ${installed ? 'available' : 'not yet available'}">requires ${HtmlEscaper.escape(fmt)}${installed ? '' : ' · missing'}</span>`;
  }

  _recommendedTag(rec) {
    const installed = this._runtimes.isInstalled(rec.id);
    const label = rec.explicit ? 'preferred' : 'recommended';
    const title = installed
      ? (rec.explicit ? 'Best fit and installed' : 'Best runtime for this host')
      : (rec.explicit ? 'Best fit: not installed yet' : 'Best for this host: install to use it');
    return `<span class="runtime-tag${installed ? ' installed' : ''}" title="${HtmlEscaper.escape(title)}">${label}: ${HtmlEscaper.escape(rec.id)}${installed ? '' : ' (not installed)'}</span>`;
  }

  _compatibleTag(rid) {
    const installed = this._runtimes.isInstalled(rid);
    return `<span class="runtime-tag compatible${installed ? ' installed' : ''}" title="${installed ? 'Installed' : 'Should load: not installed here'}">${HtmlEscaper.escape(rid)}${installed ? ' (installed)' : ''}</span>`;
  }
}
