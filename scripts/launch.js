const path = require('path');
const { spawn } = require('child_process');
const MacDevApp = require('./MacDevApp');

async function launch() {
  const rootDir = path.resolve(__dirname, '..');
  // New Electron releases can install their binary on first use.
  const electron = await require('electron');
  const executable = process.platform === 'darwin' ? MacDevApp.prepare(electron, rootDir) : electron;
  const child = spawn(executable, [rootDir, ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: false });
  const handlers = new Map();
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGUSR2']) {
    const handler = () => child.kill(signal);
    handlers.set(signal, handler);
    process.on(signal, handler);
  }
  child.on('error', (err) => { console.error('LumaBrowser could not start:', err.message); process.exitCode = 1; });
  child.on('close', (code) => {
    for (const [signal, handler] of handlers) process.removeListener(signal, handler);
    process.exitCode = code === null ? 1 : code;
  });
}

launch().catch((err) => { console.error('LumaBrowser could not start:', err.message); process.exitCode = 1; });
