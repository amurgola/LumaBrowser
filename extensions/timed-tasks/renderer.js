import TimedTasksRenderer from './ui/TimedTasksRenderer.js';

const renderer = new TimedTasksRenderer();

window.__ext_timed_tasks = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
