const path = require('path');
const JobRegistry = require('./JobRegistry');
const JobEventStream = require('./JobEventStream');
const TaskbarSurface = require('./TaskbarSurface');
const ChatJobSource = require('./sources/ChatJobSource');
const RenderJobSource = require('./sources/RenderJobSource');
const TransferJobSource = require('./sources/TransferJobSource');
const TimedTaskJobSource = require('./sources/TimedTaskJobSource');
const AppUpdateJobSource = require('./sources/AppUpdateJobSource');

const ROOT = path.join(__dirname, '..', '..', '..', '..');

let current = null;

const SETTINGS = [
  { key: 'taskbarProgress', label: 'Progress on the taskbar button', type: 'bool', default: true, help: 'Shows the combined progress of running jobs on Luma\'s taskbar button (indeterminate when unknown, red briefly after a failure).' },
  { key: 'taskbarIncludeChat', label: 'Count chat replies on the taskbar', type: 'bool', default: true, help: 'Off: a streaming chat reply does not animate the taskbar button (it is still listed by the API).' },
  { key: 'overlayBadge', label: 'Badge on the taskbar icon', type: 'bool', default: true, help: 'Windows: a small dot on the taskbar icon while jobs run.' },
  { key: 'thumbarButtons', label: 'Stop and Cancel buttons in the taskbar preview', type: 'bool', default: true, help: 'Windows: "Stop generation" and "Cancel job" buttons under the window thumbnail.' },
  { key: 'errorFlashSeconds', label: 'Show a failure for (seconds)', type: 'number', default: 4, min: 0, max: 60, help: '0 never turns the taskbar progress red.' },
];

function lazy(modulePath, pick) {
  return () => {
    try { return pick(require(modulePath)); } catch (_) { return null; }
  };
}

const defaultSeams = {
  chatRouter: () => global.__lumaChatRouter || null,
  routers: () => ({ image: global.__lumaImageRouter || null, video: global.__lumaVideoRouter || null, music: global.__lumaMusicRouter || null }),
  observe: (fn) => {
    const SenderStream = require(path.join(ROOT, 'core', 'shared', 'ipc', 'SenderStream'));
    return SenderStream.observe(fn);
  },
  updater: lazy('electron-updater', (m) => m.autoUpdater),
  nativeImage: lazy('electron', (m) => m.nativeImage),
};

module.exports = {
  id: 'jobs',
  label: 'Jobs',
  description: 'Long-running work (chat replies, renders, downloads, installs, timed tasks) as a list, a live event stream and progress on the taskbar button.',
  defaultEnabled: true,
  settingsSchema: SETTINGS,

  create(deps, seams = {}) {
    const s = { ...defaultSeams, ...seams };
    const registry = new JobRegistry(s.now ? { now: s.now } : {});
    const setting = (key) => {
      const field = SETTINGS.find((f) => f.key === key);
      return deps.settings.get(key, field ? field.default : null);
    };
    const sources = [
      new ChatJobSource({ registry, getRouter: s.chatRouter }),
      new RenderJobSource({ registry, getRouters: s.routers }),
      new TransferJobSource({ registry, observe: s.observe }),
      new TimedTaskJobSource({ registry, getApi: () => (deps.extensions || {})['timed-tasks'] || null }),
      new AppUpdateJobSource({ registry, getUpdater: s.updater }),
    ];
    for (const source of sources) {
      try { source.start(); } catch (err) { deps.log.warn(`a job source failed to start: ${(err && err.message) || err}`); }
    }
    const stream = new JobEventStream({ registry });
    const taskbar = new TaskbarSurface({
      registry,
      getWindow: () => (deps.windows ? deps.windows.getMainWindow() : null),
      options: () => ({
        progress: setting('taskbarProgress') !== false,
        includeChat: setting('taskbarIncludeChat') !== false,
        overlay: setting('overlayBadge') !== false,
        thumbar: setting('thumbarButtons') !== false,
        errorSeconds: setting('errorFlashSeconds'),
      }),
      nativeImage: s.nativeImage(),
    });
    taskbar.start();
    current = registry;

    return {
      registry,
      mount(router) {
        router.get('/', (_req, res) => {
          res.json({ success: true, ...registry.list(), aggregate: module.exports.aggregateOf(registry) });
        });
        router.get('/stream', (req, res) => stream.handle(req, res));
        router.post('/:id/cancel', async (req, res) => {
          const result = await registry.cancel(String(req.params.id || ''));
          const { status, ...body } = result;
          res.status(status || (result.success ? 200 : 400)).json(body);
        });
      },
      onSettingsChanged() {
        taskbar.render();
      },
      dispose() {
        if (current === registry) current = null;
        for (const source of sources) {
          try { source.stop(); } catch (_) {}
        }
        stream.close();
        taskbar.dispose();
        registry.dispose();
      },
    };
  },

  aggregateOf(registry) {
    const { jobs, ...agg } = registry.aggregate();
    return agg;
  },

  summary() {
    if (!current) return null;
    const agg = current.aggregate();
    const count = agg.running + agg.queued;
    if (!count) return { running: 0, queued: 0, progress: null, line: null };
    const pct = agg.progress === null ? '' : ` ${Math.round(agg.progress * 100)}%`;
    const line = count === 1 ? `1 job running${pct}: ${agg.jobs[0].title}` : `${count} jobs running${pct}`;
    return { running: agg.running, queued: agg.queued, progress: agg.progress, line };
  },
};
