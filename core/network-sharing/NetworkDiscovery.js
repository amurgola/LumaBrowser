const MdnsInstancePool = require('./MdnsInstancePool');
const MdnsAdvertisement = require('./MdnsAdvertisement');
const MdnsBrowser = require('./MdnsBrowser');

class NetworkDiscovery {
  static SERVICE_TYPE = 'lumabrowser';
  static _pool = new MdnsInstancePool();

  static isAvailable() {
    return NetworkDiscovery._pool.isAvailable();
  }

  static advertise({ name, port, txt } = {}) {
    const options = { serviceType: NetworkDiscovery.SERVICE_TYPE, name, port, txt };
    return new MdnsAdvertisement(NetworkDiscovery._pool, options).start();
  }

  static browse({ onUp, onDown } = {}) {
    const options = { serviceType: NetworkDiscovery.SERVICE_TYPE, onUp, onDown };
    return new MdnsBrowser(NetworkDiscovery._pool, options).start();
  }

  static destroy() {
    NetworkDiscovery._pool.destroy();
  }
}

module.exports = NetworkDiscovery;
