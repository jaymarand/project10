import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import { useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import ComingSoon from './pages/ComingSoon';

const DispatchDashboard = React.lazy(() => import('./pages/DispatchDashboard'));
const DriverManagement = React.lazy(() => import('./pages/DriverManagement'));
const StorePage = React.lazy(() => import('./pages/StorePage'));
const ContainerLogsPage = React.lazy(() => import('./pages/ContainerLogsPage'));
const ParLevelsPage = React.lazy(() => import('./pages/ParLevelsPage'));

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <React.Suspense fallback={<div>Loading...</div>}>
          {children}
        </React.Suspense>
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DispatchDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver"
            element={
              <PrivateRoute>
                <ComingSoon />
              </PrivateRoute>
            }
          />
          <Route
            path="/driver-management"
            element={
              <PrivateRoute>
                <DriverManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/store"
            element={
              <PrivateRoute>
                <StorePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/par-levels"
            element={
              <PrivateRoute>
                <ParLevelsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/container-logs"
            element={
              <PrivateRoute>
                <ContainerLogsPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
