import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function ProjectLayout() {
  const { projectId } = useParams();
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api(`/api/projects/${projectId}`);
        if (!cancelled) {
          setData(d);
          setErr('');
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e.message);
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, tick]);

  if (err && !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{err}</p>
        <Link to="/">Back to projects</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="app-loading" style={{ minHeight: '50vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const { project, role, boards } = data;
  const boardId = boards?.[0]?._id;

  return (
    <div className="proj-layout">
      <header className="proj-header">
        <div className="proj-header-left">
          <Link to="/" className="back-link">
            ← Projects
          </Link>
          <div className="proj-title-block">
            <span className="proj-key">{project.key}</span>
            <h1>{project.name}</h1>
          </div>
        </div>
        <nav className="proj-nav">
          <NavLink end to={`/p/${projectId}`} className={({ isActive }) => (isActive ? 'active' : '')}>
            Board
          </NavLink>
          <NavLink
            to={`/p/${projectId}/sprints`}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Sprints
          </NavLink>
          <NavLink
            to={`/p/${projectId}/settings`}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Settings
          </NavLink>
        </nav>
        <div className="proj-header-right">
          <span className="role-pill">{role}</span>
          <NotificationBell />
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <Outlet
        context={{
          project,
          role,
          boardId,
          boards,
          reloadProject: () => setTick((t) => t + 1),
        }}
      />
      <style>{`
        .proj-layout { min-height: 100vh; display: flex; flex-direction: column; }
        .proj-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .proj-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 200px;
        }
        .back-link { color: var(--muted); font-size: 0.9rem; white-space: nowrap; }
        .back-link:hover { color: var(--text); }
        .proj-title-block h1 {
          margin: 0;
          font-size: 1.15rem;
          display: inline;
        }
        .proj-key {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent);
          margin-right: 0.5rem;
        }
        .proj-nav {
          display: flex;
          gap: 0.25rem;
        }
        .proj-nav a {
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          color: var(--muted);
          text-decoration: none;
          font-size: 0.9rem;
        }
        .proj-nav a:hover { color: var(--text); background: var(--surface2); }
        .proj-nav a.active {
          color: var(--text);
          background: var(--surface2);
          font-weight: 600;
        }
        .proj-header-right {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-left: auto;
        }
        .role-pill {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          background: var(--surface2);
          color: var(--muted);
        }
        .user-name { color: var(--muted); font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
