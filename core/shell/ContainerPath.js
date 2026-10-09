class ContainerPath {
  static WIN_PREFIX = '\\\\docker\\';
  static POSIX_PREFIX = '/.luma-docker/';
  static UNC_PREFIX = '//docker/';

  static parse(hostPath) {
    if (!hostPath || typeof hostPath !== 'string') return null;
    const rest = ContainerPath._afterPrefix(hostPath.replace(/\\/g, '/'));
    if (rest == null) return null;
    return ContainerPath._splitContainer(rest);
  }

  static isContainerPath(hostPath) {
    return ContainerPath.parse(hostPath) !== null;
  }

  static toHostPath(container, posix, platform = process.platform) {
    const clean = `/${String(posix || '/').replace(/^\/+/, '')}`;
    if (platform === 'win32') return `${ContainerPath.WIN_PREFIX}${container}${clean.replace(/\//g, '\\')}`;
    return `${ContainerPath.POSIX_PREFIX}${container}${clean}`;
  }

  static _afterPrefix(slashed) {
    if (slashed.toLowerCase().startsWith(ContainerPath.UNC_PREFIX)) return slashed.slice(ContainerPath.UNC_PREFIX.length);
    if (slashed.startsWith(ContainerPath.POSIX_PREFIX)) return slashed.slice(ContainerPath.POSIX_PREFIX.length);
    return null;
  }

  static _splitContainer(rest) {
    const slash = rest.indexOf('/');
    const container = slash === -1 ? rest : rest.slice(0, slash);
    if (!container) return null;
    const posix = slash === -1 ? '/' : ContainerPath._trimTrailingSlashes(rest.slice(slash));
    return { container, posix: posix || '/' };
  }

  static _trimTrailingSlashes(posix) {
    return posix.length > 1 ? posix.replace(/\/+$/, '') : posix;
  }
}

module.exports = ContainerPath;
