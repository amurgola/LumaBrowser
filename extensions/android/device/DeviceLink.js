class DeviceLink {
  static ADB_SERVER = { host: '127.0.0.1', port: 5037 };

  constructor(adb, serial) {
    this.adb = adb;
    this.serial = serial;
  }

  static async connect(serial, tango) {
    const server = new tango.adb.AdbServerClient(new tango.nodeTcp.AdbServerNodeTcpConnector(DeviceLink.ADB_SERVER));
    return new DeviceLink(await server.createAdb({ serial }), serial);
  }

  async shell(command) {
    const output = await this.adb.subprocess.noneProtocol.spawnWaitText(command);
    return output.replace(/\r\n/g, '\n');
  }

  async shellBytes(command) {
    return Buffer.from(await this.adb.subprocess.noneProtocol.spawnWait(command));
  }

  async close() {
    try { await this.adb.close(); } catch (_) {}
  }
}

module.exports = DeviceLink;
