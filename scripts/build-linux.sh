#!/usr/bin/env bash
set -euo pipefail

PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/mnt/' | paste -sd: -)"
export PATH

log() { printf '[build-linux] %s\n' "$*"; }
die() { printf '[build-linux] %s\n' "$*" >&2; exit 1; }

SRC="${1:-}"
[ -n "$SRC" ] || die "no source path given"
[ -f "$SRC/package.json" ] || die "no package.json at $SRC"
shift

DO_SETUP=0
FAST=0
for arg in "$@"; do
  case "$arg" in
    --setup) DO_SETUP=1 ;;
    --fast)  FAST=1 ;;
    *) die "unknown option: $arg" ;;
  esac
done

WORK="${LUMA_LINUX_WORKDIR:-$HOME/.cache/lumabrowser-linux-build}"

node_major() { node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0; }

if [ "$DO_SETUP" = 1 ]; then
  log "installing system dependencies (sudo will prompt)"
  sudo apt-get update
  sudo apt-get install -y \
    build-essential python3 pkg-config git rsync xvfb curl ca-certificates \
    libgtk-3-dev libnotify-dev libnss3 libxss1 libxtst6 xdg-utils \
    libsecret-1-dev libgbm1 libxkbcommon0 libdrm2
  for pkg in libasound2t64 libasound2 libatk1.0-0t64 libatk1.0-0 \
             libatk-bridge2.0-0t64 libatk-bridge2.0-0; do
    if sudo apt-get install -y "$pkg" >/dev/null 2>&1; then log "installed $pkg"; fi
  done

  if [ "$(node_major)" -lt 20 ]; then
    log "installing Node.js 20 (NodeSource) - CI pins 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  log "setup complete"
fi

missing=""
for tool in node npm rsync xvfb-run make g++ python3; do
  command -v "$tool" >/dev/null 2>&1 || missing="$missing $tool"
done
if [ -n "$missing" ]; then
  die "missing in this distro:$missing - re-run with --setup"
fi
if [ "$(node_major)" -lt 20 ]; then
  die "Node $(node -v) is too old (CI pins 20) - re-run with --setup"
fi
log "node $(node -v), npm $(npm -v)"

log "syncing source -> $WORK"
mkdir -p "$WORK"
rsync -a --delete \
  --exclude '/node_modules/' \
  --exclude '/.git/' \
  --exclude '/dist/' \
  --exclude '/models/' \
  --exclude '/runtimes/' \
  --exclude '/research/' \
  --exclude '/tests/' \
  --exclude '/test-data/' \
  --exclude '/.idea/' \
  --exclude '/.claude/' \
  "$SRC/" "$WORK/"

cd "$WORK"

if [ "$FAST" = 1 ] && [ -d node_modules/electron-builder ]; then
  log "--fast: reusing existing node_modules in $WORK"
else
  log "npm ci (rebuilds better-sqlite3 against Linux Electron) ..."
  npm ci
fi

for v in CSC_LINK CSC_KEY_PASSWORD; do
  if [ -z "${!v:-}" ]; then unset "$v" || true; fi
done
export ELECTRON_DISABLE_SANDBOX=1

rm -f dist/*.AppImage dist/*.deb dist/latest-linux.yml

log "npm run build:vscode ..."
npm run build:vscode --if-present

log "npm run build:docs-rag ..."
npm run build:docs-rag

log "npm run build:linux (under xvfb) ..."
xvfb-run -a npm run build:linux

mkdir -p "$SRC/dist"
shopt -s nullglob
copied=0
for f in dist/*.AppImage dist/*.deb dist/latest-linux.yml; do
  cp -f "$f" "$SRC/dist/"
  log "-> dist/$(basename "$f")"
  copied=1
done
[ "$copied" = 1 ] || die "build finished but produced no .AppImage"

log "done"
