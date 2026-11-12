class PortListenerParser {
  static NETSTAT_LISTENING = /^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i;

  static fromNetstat(stdout, port, selfPid = process.pid) {
    const pids = new Set();
    for (const line of String(stdout || '').split('\n')) {
      const m = line.match(PortListenerParser.NETSTAT_LISTENING);
      if (m && Number(m[1]) === Number(port)) pids.add(m[2]);
    }
    return PortListenerParser._withoutReserved([...pids], selfPid);
  }

  static fromLsof(stdout, selfPid = process.pid) {
    const pids = String(stdout || '').trim().split('\n').map((s) => s.trim()).filter(Boolean);
    return PortListenerParser._withoutReserved([...new Set(pids)], selfPid);
  }

  static _withoutReserved(pids, selfPid) {
    return pids.filter((pid) => pid !== '0' && pid !== String(selfPid));
  }
}

module.exports = PortListenerParser;
