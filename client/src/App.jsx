import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectLayout from './pages/ProjectLayout.jsx';
import ProjectBoard from './pages/ProjectBoard.jsx';
import ProjectSprints from './pages/ProjectSprints.jsx';
import ProjectSettings from './pages/ProjectSettings.jsx';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <style>{`
        .app-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--muted);
        }
        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <Private>
              <Dashboard />
            </Private>
          }
        />
        <Route
          path="/p/:projectId"
          element={
            <Private>
              <ProjectLayout />
            </Private>
          }
        >
          <Route index element={<ProjectBoard />} />
          <Route path="sprints" element={<ProjectSprints />} />
          <Route path="settings" element={<ProjectSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
