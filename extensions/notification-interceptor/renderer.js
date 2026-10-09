import NotificationInterceptorRenderer from './ui/NotificationInterceptorRenderer.js';

const renderer = new NotificationInterceptorRenderer();

window.__ext_notification_interceptor = {
  activate: (context) => renderer.activate(context),
  deactivate: () => renderer.deactivate(),
};
