import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd'; // <-- import App as AntApp
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRequestsPage from './pages/AdminRequestsPage';
import MicroservicesPage from './pages/MicroservicesPage';
import MicroserviceDetailPage from './pages/MicroserviceDetailPage';
import { useTheme } from './hooks/useTheme';
import LogsPage from './pages/LogsPage';
import SlaPage from './pages/SlaPage';
import SlaConfigPage from './pages/SlaConfigPage';
import NotificationsPage from './pages/NotificationsPage';
const ThemedApp = () => {
  const { darkMode } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#228B22',
          colorBgBase: darkMode ? '#121212' : '#FFFFFF',
          colorTextBase: darkMode ? '#FFFFFF' : '#000000',
        },
      }}
    >
      <AntApp> {/* <-- Ajoutez cette ligne */}
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN_SUP']}><AdminUsersPage /></ProtectedRoute>} />
                    <Route path="/admin/requests" element={<ProtectedRoute roles={['ADMIN_SUP']}><AdminRequestsPage /></ProtectedRoute>} />
                    <Route path="/microservices" element={<MicroservicesPage />} />
                    <Route path="/microservices/:id" element={<MicroserviceDetailPage />} />
                    <Route path="/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
                    <Route path="/sla" element={<ProtectedRoute><SlaPage /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                    <Route path="/admin/sla-config" element={
                      <ProtectedRoute roles={['ADMIN', 'ADMIN_SUP']}><SlaConfigPage /></ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AntApp> {/* <-- Fin de l'enveloppe */}
    </ConfigProvider>
  );
};

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  </AuthProvider>
);

export default App;