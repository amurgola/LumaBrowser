const GlanceService = require('./GlanceService');
const GlanceOpener = require('./GlanceOpener');

const D = GlanceService.DEFAULTS;

module.exports = {
  id: 'glance',
  label: 'Glance',
  description: 'GET /api/desktop/glance/ answers a one-line Hub summary (next event, unread, due tasks) for taskbar clocks and other tiny surfaces; POST /glance/open opens the Hub.',
  defaultEnabled: true,

  settingsSchema: [
    { key: 'showCalendar', label: 'Next calendar event', type: 'bool', default: D.showCalendar, help: 'The event in progress, else the next one within 24 hours (Hub calendars).' },
    { key: 'showQueue', label: 'Unread conversations', type: 'bool', default: D.showQueue, help: 'How many threads are open in the Hub conversation queue.' },
    { key: 'showTasks', label: 'Tasks due', type: 'bool', default: D.showTasks, help: 'Board tasks due today or overdue, outside the done column.' },
    { key: 'showRunning', label: 'Running timed tasks', type: 'bool', default: D.showRunning, help: 'Scheduled agent tasks running right now (covered by Running jobs while the jobs feature is on).' },
    { key: 'showJobs', label: 'Running jobs', type: 'bool', default: D.showJobs, help: 'Renders, downloads and chat replies from the jobs feature, e.g. "42%".' },
    { key: 'maxLineLength', label: 'Maximum line length', type: 'number', default: D.maxLineLength, help: 'Characters (8 to 200). Long titles are shortened first.' },
    {
      key: 'timeFormat', label: 'Time format', type: 'select', default: D.timeFormat,
      options: [{ value: '12h', label: '12 hour (2:30pm)' }, { value: '24h', label: '24 hour (14:30)' }],
    },
    { key: 'separator', label: 'Separator', type: 'text', default: D.separator, help: 'Between the parts of the line, e.g. " · " or " | ".' },
    { key: 'emptyText', label: 'Text when there is nothing to show', type: 'text', default: D.emptyText, help: 'Leave empty so clients show their own default (the stock clock).' },
  ],

  create(deps) {
    const glance = new GlanceService(deps);
    const opener = new GlanceOpener(deps, glance);
    return {
      glance,
      mount(router) {
        router.get('/', async (req, res) => {
          const fresh = req.query.fresh === '1' || req.query.fresh === 'true';
          const summary = await glance.get({ fresh });
          const format = String(req.query.format || 'json');
          if (format === 'text' || format === 'tooltip') {
            res.type('text/plain; charset=utf-8').send(format === 'text' ? summary.line : summary.tooltip);
            return;
          }
          res.json({ success: true, ...summary });
        });

        router.post('/open', async (req, res) => {
          const body = req.body && typeof req.body === 'object' ? req.body : {};
          const result = await opener.open({ target: body.target, id: body.id });
          res.status(result.status).json(result.body);
        });
      },
      onSettingsChanged() {
        glance.invalidate();
      },
      dispose() {
        glance.invalidate();
      },
    };
  },
};
