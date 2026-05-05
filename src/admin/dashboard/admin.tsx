import './style.scss';
import App from './Components/App';
import { dashboardInfo } from './utils/data';

document.addEventListener('DOMContentLoaded', () => {
  const dashboardEl = document.getElementById('bp3dAdminDashboard');
  if (dashboardEl) {
    const info = JSON.parse(dashboardEl.dataset.info || '{}');
    (window as any).ReactDOM.createRoot(dashboardEl).render(<App {...dashboardInfo(info)} />);
  }
});
