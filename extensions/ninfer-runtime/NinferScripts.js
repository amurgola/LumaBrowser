const fs = require('fs');
const path = require('path');
const CoreRequire = require('./CoreRequire');

const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');

class NinferScripts {
  static PATH_PREFIX = 'export PATH="$HOME/.local/bin:/usr/local/cuda/bin:$PATH"';

  static TOOLCHAIN_PROBE = `#!/bin/bash
${NinferScripts.PATH_PREFIX}
printf 'nvcc=%s\\n' "$( (nvcc --version 2>/dev/null || /usr/local/cuda/bin/nvcc --version 2>/dev/null) | grep -o 'release [0-9.]*' | head -1)"
printf 'cmake=%s\\n' "$(cmake --version 2>/dev/null | head -1 | grep -o '[0-9][0-9.]*' | head -1)"
printf 'gxx=%s\\n' "$(g++ --version 2>/dev/null | head -1)"
printf 'ninja=%s\\n' "$(command -v ninja || command -v ninja-build || true)"
printf 'git=%s\\n' "$(command -v git || true)"
printf 'pkgconfig=%s\\n' "$(command -v pkg-config || true)"
printf 'ffmpeg=%s\\n' "$(pkg-config --modversion libavformat 2>/dev/null || true)"
printf 'curl=%s\\n' "$(pkg-config --modversion libcurl 2>/dev/null || true)"
`;

  static WRAPPER = `#!/bin/bash
HERE=$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)
export LD_LIBRARY_PATH="$HERE/lib\${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}:/usr/local/cuda/lib64"
exec "$HERE/bin/ninfer-serve" "$@"
`;

  static buildScript(src, work, installDir) {
    const q = WslFormat.shellQuote;
    return `#!/bin/bash
set -e
${NinferScripts.PATH_PREFIX}
WORK=${q(work)}
if [ "$1" = clone ]; then
  rm -rf "$WORK"
  git clone -q ${q(src.repo)} "$WORK"
  cd "$WORK" && git checkout -q ${q(src.commit)}
  exit 0
fi
if [ "$1" = build ]; then
  cd "$WORK"
  cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=Release
  cmake --build build -j "$(nproc)"
  exit 0
fi
if [ "$1" = pack ]; then
  INSTALL=${q(installDir)}
  rm -rf "$INSTALL"; mkdir -p "$INSTALL/bin" "$INSTALL/lib"
  cp "$WORK/build/apps/ninfer-serve" "$INSTALL/bin/"
  cp "$WORK/build/apps/ninfer-cli" "$INSTALL/bin/" 2>/dev/null || true
  CUDART="$(dirname "$(command -v nvcc || echo /usr/local/cuda/bin/nvcc)")/../targets/x86_64-linux/lib/libcudart.so.13"
  cp -L "$CUDART" "$INSTALL/lib/" 2>/dev/null || cp -L /usr/local/cuda/lib64/libcudart.so.13 "$INSTALL/lib/" 2>/dev/null || true
  cp "$2" "$INSTALL/ninfer-serve"
  chmod +x "$INSTALL/ninfer-serve" "$INSTALL/bin/ninfer-serve"
  echo ${q(src.commit)} > "$INSTALL/COMMIT"
  exit 0
fi
echo "unknown step: $1" >&2; exit 2
`;
  }

  static write(managedDir, name, body, mode) {
    const hostPath = path.join(managedDir, name);
    fs.mkdirSync(managedDir, { recursive: true });
    fs.writeFileSync(hostPath, body.replace(/\r\n/g, '\n'), { mode: 0o755 });
    return mode === 'wsl' ? WslFormat.toWslPath(hostPath) : hostPath;
  }
}

module.exports = NinferScripts;
