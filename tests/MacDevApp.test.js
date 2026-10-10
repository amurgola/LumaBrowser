const fs = require('fs');
const os = require('os');
const path = require('path');
const MacDevApp = require('../scripts/MacDevApp');

let root, source, electron, icon;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-dev-app-'));
  source = path.join(root, 'runtime', 'Electron.app');
  electron = path.join(source, 'Contents', 'MacOS', 'Electron');
  icon = path.join(root, 'icon', 'icon.png');
  fs.mkdirSync(path.dirname(electron), { recursive: true });
  fs.mkdirSync(path.dirname(icon), { recursive: true });
  fs.writeFileSync(electron, 'runtime');
  fs.writeFileSync(path.join(source, 'Contents', 'Info.plist'), 'original metadata');
  fs.writeFileSync(icon, 'icon');
});
afterEach(() => { jest.restoreAllMocks(); fs.rmSync(root, { recursive: true, force: true }); });

test('copies the runtime without modifying it and preserves relocatable framework symlinks', () => {
  fs.mkdirSync(path.join(source, 'Contents', 'Resources'));
  fs.symlinkSync('Resources', path.join(source, 'Contents', 'LinkedResources'));
  const brand = jest.spyOn(MacDevApp, 'brand').mockImplementation(() => {});
  const binary = MacDevApp.prepare(electron, root);
  expect(binary).toContain('LumaBrowser Dev.app');
  expect(fs.readFileSync(binary, 'utf8')).toBe('runtime');
  expect(fs.readlinkSync(path.resolve(binary, '../../LinkedResources'))).toBe('Resources');
  expect(fs.readFileSync(path.join(source, 'Contents', 'Info.plist'), 'utf8')).toBe('original metadata');
  expect(MacDevApp.prepare(electron, root)).toBe(binary);
  expect(brand).toHaveBeenCalledTimes(1);
});

test('invalidates the cache when the runtime metadata or project icon changes', () => {
  jest.spyOn(MacDevApp, 'brand').mockImplementation(() => {});
  const first = MacDevApp.prepare(electron, root);
  fs.writeFileSync(icon, 'new icon');
  const second = MacDevApp.prepare(electron, root);
  expect(second).not.toBe(first);
  fs.writeFileSync(path.join(source, 'Contents', 'Info.plist'), 'new runtime');
  expect(MacDevApp.prepare(electron, root)).not.toBe(second);
});

test('does not cache a failed preparation and removes staging files', () => {
  jest.spyOn(MacDevApp, 'brand').mockImplementation(() => { throw new Error('signing failed'); });
  expect(() => MacDevApp.prepare(electron, root)).toThrow('signing failed');
  expect(fs.readdirSync(path.join(root, '.cache', 'mac-dev-app'))).toEqual([]);
});

test('brands the bundle, generates a Retina icon, and retains signing entitlements', () => {
  const run = jest.fn();
  MacDevApp.brand(source, icon, root, run);
  const plist = path.join(source, 'Contents', 'Info.plist');
  expect(run).toHaveBeenCalledWith('/usr/bin/plutil', ['-replace', 'CFBundleName', '-string', 'LumaBrowser Dev', plist]);
  expect(run).toHaveBeenCalledWith('/usr/bin/plutil', ['-replace', 'CFBundleDisplayName', '-string', 'LumaBrowser Dev', plist]);
  expect(run.mock.calls.filter(([cmd]) => cmd === '/usr/bin/sips')).toHaveLength(10);
  expect(run).toHaveBeenCalledWith('/usr/bin/iconutil', ['-c', 'icns', path.join(root, 'LumaBrowser.iconset'), '-o', path.join(source, 'Contents', 'Resources', 'lumabrowser.icns')]);
  expect(run).toHaveBeenCalledWith('/usr/bin/codesign', ['--force', '--sign', '-', '--preserve-metadata=entitlements,requirements,flags', source]);
});
