const TabRegistry = require('./TabRegistry');
const TabHosts = require('./TabHosts');

class TabTransfer {
  constructor({ hosts, registry, channel, factory, activation, lifecycle, emitter }) {
    this._hosts = hosts;
    this._registry = registry;
    this._channel = channel;
    this._factory = factory;
    this._activation = activation;
    this._lifecycle = lifecycle;
    this._emitter = emitter;
  }

  move(tabId, toHostId, { index, activate = true } = {}) {
    const entry = this._registry.get(tabId);
    if (!entry) return TabRegistry.notFound(tabId);
    if (!this._hosts.liveWindowOf(toHostId)) return { success: false, error: `Window ${toHostId} not found` };
    if (!entry.isMovable()) return { success: false, error: 'This tab cannot move to another window' };
    if (entry.hostId === toHostId) return this._reorderOnly(entry, index, activate);
    const from = entry.hostId;
    this._leave(entry);
    this._factory.reparent(entry, toHostId);
    this._channel.send('tab:transferred', { id: tabId, windowId: toHostId }, from);
    this._arrive(entry, index, activate);
    this._emitter.emit('tabTransferred', tabId, from, toHostId);
    this._lifecycle.reportIfEmptied(from);
    return { success: true, windowId: toHostId };
  }

  evacuate(hostId) {
    if (hostId === TabHosts.MAIN_ID || !this._hosts.has(hostId)) return false;
    for (const entry of this._registry.inHost(hostId)) {
      if (entry.keepAlive) {
        this._lifecycle.hide(entry.id);
      } else {
        this._lifecycle.remember(entry);
        this._lifecycle.destroy(entry.id);
      }
    }
    this._registry.setActive(hostId, null);
    this._hosts.remove(hostId);
    return true;
  }

  resync(hostId) {
    const entries = this._registry.inHost(hostId);
    for (const entry of entries) this._channel.broadcast(entry);
    const activeId = this._registry.activeIn(hostId);
    if (activeId !== null) this._channel.send('tab:switched', { id: activeId }, hostId);
    return entries.length;
  }

  _reorderOnly(entry, index, activate) {
    if (Number.isInteger(index)) this._lifecycle.move(entry.id, index);
    if (activate) this._activation.switchTo(entry.id);
    return { success: true, windowId: entry.hostId };
  }

  _leave(entry) {
    const wasActive = this._registry.isActive(entry.id);
    const next = wasActive ? this._registry.neighbourOf(entry.id) : null;
    if (wasActive) this._registry.setActive(entry.hostId, null);
    if (next) this._activation.switchTo(next.id);
  }

  _arrive(entry, index, activate) {
    if (Number.isInteger(index)) this._registry.move(entry.id, index);
    this._channel.broadcast(entry);
    if (Number.isInteger(index)) this._channel.sendForTab(entry, 'tab:moved', { id: entry.id, index: this._registry.indexOf(entry.id), order: this._registry.order.slice() });
    if (activate) this._activation.switchTo(entry.id);
  }
}

module.exports = TabTransfer;
