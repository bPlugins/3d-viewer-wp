import './dash/base.scss';
import './dash/dashboard.scss';
import './dash/port.scss';
import './style.scss';
import { createRoot } from '@wordpress/element';
import App from './Components/App';
import { dashboardInfo } from './utils/data';

document.addEventListener('DOMContentLoaded', () => {
  const dashboardEl = document.getElementById('bp3dAdminDashboard');
  if (dashboardEl) {
    let info: any = {};
    try {
      info = JSON.parse(dashboardEl.dataset.info || '{}');
    } catch (_e) {
      // A broken payload should still show the dashboard, with defaults.
    }
    createRoot(dashboardEl).render(<App {...dashboardInfo(info)} />);
  }
});
