import BootLog from './boot/BootLog.js';
import ShellApp from './app/ShellApp.js';
import SetupWizard from '../../core/shell/ui/wizard/SetupWizard.js';
import UISlotManager from '../../core/shell/ui/slots/UISlotManager.js';
import BrowserRenderer from '../../core/browser/ui/BrowserRenderer.js';

BootLog.log('shell entry parsed');

const app = new ShellApp({ SetupWizard, UISlotManager, BrowserRenderer });
const start = () => {
  BootLog.log('DOMContentLoaded');
  app.start();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
