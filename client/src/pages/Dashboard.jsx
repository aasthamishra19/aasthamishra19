import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from '../components/NotificationBell.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [keyVal, setKeyVal] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try {
      const d = await api('/api/projects');
      setProjects(d.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject(e) {
    e.preventDefault();
    setErr('');
    try {
      const d = await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name, key: keyVal, description: desc }),
      });
      setModal(false);
      setName('');
      setKeyVal('');
      setDesc('');
      nav(`/p/${d.project._id}`);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="dash">
      <header className="dash-header">
        <div className="dash-brand">
          <span className="logo">◆</span> FlowTrack
        </div>
        <div className="dash-actions">
          <NotificationBell />
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="dash-main">
        <div className="dash-toolbar">
          <h1>Your projects</h1>
          <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
            + New project
          </button>
        </div>
        {loading ? (
          <p className="muted">Loading projects…</p>
        ) : projects.length === 0 ? (
          <div className="empty card">
            <p>No projects yet. Create one to start your first board.</p>
            <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
              Create project
            </button>
          </div>
        ) : (
          <ul className="project-grid">
            {projects.map((p) => (
              <li key={p._id}>
                <Link to={`/p/${p._id}`} className="project-card card">
                  <span className="project-key">{p.key}</span>
                  <h2>{p.name}</h2>
                  <p>{p.description || 'No description'}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      {modal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModal(false)}>
          <div className="modal card" role="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>New project</h2>
            <form onSubmit={createProject}>
              {err && <div className="form-error">{err}</div>}
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Key (2–6 chars, e.g. FT)
                <input
                  value={keyVal}
                  onChange={(e) => setKeyVal(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </label>
              <label>
                Description
                <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        .dash { min-height: 100vh; }
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .dash-brand {
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo { color: var(--accent); }
        .dash-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .user-name { color: var(--muted); font-size: 0.9rem; }
        .dash-main { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
        .dash-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .dash-toolbar h1 { margin: 0; font-size: 1.5rem; }
        .muted { color: var(--muted); }
        .empty {
          text-align: center;
          padding: 3rem 2rem;
          max-width: 480px;
          margin: 2rem auto;
        }
        .empty p { color: var(--muted); margin-bottom: 1rem; }
        .project-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1rem;
        }
        .project-card {
          display: block;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s, transform 0.15s;
        }
        .project-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
          text-decoration: none;
        }
        .project-key {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.05em;
        }
        .project-card h2 { margin: 0.35rem 0; font-size: 1.1rem; }
        .project-card p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 1rem;
        }
        .modal {
          width: 100%;
          max-width: 420px;
        }
        .modal h2 { margin-top: 0; }
        .modal form { display: flex; flex-direction: column; gap: 1rem; }
        .modal label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .form-error {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 0.6rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .modal-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}
