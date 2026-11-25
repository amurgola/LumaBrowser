class LocalServerConnection {
  static LOOPBACK = '127.0.0.1';

  static of(runtimeServer, status = runtimeServer.getStatus()) {
    const plan = runtimeServer.plan || null;
    return {
      baseUrl: `http://${status.host || LocalServerConnection.LOOPBACK}:${status.port}`,
      apiKey: runtimeServer.authKey || null,
      model: plan && plan.apiModelName ? plan.apiModelName : null,
    };
  }

  static ofReady(runtimeServer) {
    if (!runtimeServer || typeof runtimeServer.getStatus !== 'function') return null;
    const status = runtimeServer.getStatus();
    return status && status.state === 'ready' && status.port ? LocalServerConnection.of(runtimeServer, status) : null;
  }
}

module.exports = LocalServerConnection;
