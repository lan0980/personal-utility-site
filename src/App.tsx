import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarTodo from './pages/CalendarTodo';
import LinkBoard from './pages/LinkBoard';
import About from './pages/About';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import { authManager } from './services/auth';

/**
 * AuthGuard — protects routes that require authentication.
 * Redirects to /login if not logged in.
 */
const AuthGuard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(authManager.isLoggedIn());

  useEffect(() => {
    const unsubscribe = authManager.onAuthChange(() => {
      const loggedIn = authManager.isLoggedIn();
      setIsLoggedIn(loggedIn);
      if (!loggedIn) {
        navigate('/login', { replace: true });
      }
    });
    return unsubscribe;
  }, [navigate]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public route — login/register */}
      <Route path="/login" element={<Login />} />

      {/* Public route — privacy policy (no auth required) */}
      <Route path="/privacy" element={<Privacy />} />

      {/* Protected routes — wrapped in AuthGuard + Layout */}
      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarTodo />} />
          <Route path="/links" element={<LinkBoard />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
