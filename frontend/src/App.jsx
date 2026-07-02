import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { AlertProvider } from './context/AlertContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Zones from './pages/Zones';
import ZoneDetail from './pages/ZoneDetail';
import BatchDetail from './pages/BatchDetail';
import Alerts from './pages/Alerts';
import RequireAuth from './components/layout/RequireAuth';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <AlertProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/zones" element={<Zones />} />
                  <Route path="/zones/:zoneId" element={<ZoneDetail />} />
                  <Route path="/zones/:zoneId/batches/:batchId" element={<BatchDetail />} />
                  <Route path="/alerts" element={<Alerts />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AlertProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
