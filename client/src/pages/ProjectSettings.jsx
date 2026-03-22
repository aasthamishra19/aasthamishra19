import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../api';

export default function ProjectSettings() {
  const { project, role, reloadProject } = useOutletContext();
  const nav = useNavigate();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    setName(project.name);
    setDescription(project.description || '');
  }, [project._id, project.name, project.description]);

  const canManage = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  async function saveProject(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api(`/api/projects/${project._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, description }),
      });
      setMsg('Saved.');
      reloadProject?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function invite(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api(`/api/projects/${project._id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, memberRole: inviteRole }),
      });
      setInviteEmail('');
      setMsg('Member invited.');
      reloadProject?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function changeRole(userId, memberRole) {
    setErr('');
    try {
      await api(`/api/projects/${project._id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ memberRole }),
      });
      reloadProject?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function removeMember(userId) {
    if (!confirm('Remove this member?')) return;
    setErr('');
    try {
      await api(`/api/projects/${project._id}/members/${userId}`, { method: 'DELETE' });
      reloadProject?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteProject() {
    if (!confirm('Delete this project and all tasks? This cannot be undone.')) return;
    try {
      await api(`/api/projects/${project._id}`, { method: 'DELETE' });
      nav('/');
    } catch (e) {
      setErr(e.message);
    }
  }

  const members = project.members || [];

  return (
    <div className="settings-page">
      <h1>Project settings</h1>
      {msg && <p className="ok">{msg}</p>}
      {err && <p className="form-error">{err}</p>}

      <section className="card">
        <h2>General</h2>
        <form onSubmit={saveProject}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required disabled={!canManage} />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage}
            />
          </label>
          {canManage && (
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          )}
        </form>
      </section>

      <section className="card">
        <h2>Members & roles</h2>
        <p className="hint">
          <strong>Owner</strong> full control. <strong>Admin</strong> manages work and members.{' '}
          <strong>Member</strong> can create tasks, comment, and use the board.
        </p>
        <ul className="member-list">
          <li>
            <span>{project.owner?.name || 'Owner'}</span>
            <span className="email">{project.owner?.email}</span>
            <span className="role">owner</span>
          </li>
          {members.map((m) => (
            <li key={m.user._id}>
              <span>{m.user.name}</span>
              <span className="email">{m.user.email}</span>
              {canManage ? (
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.user._id, e.target.value)}
                  disabled={m.role === 'owner'}
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </select>
              ) : (
                <span className="role">{m.role}</span>
              )}
              {canManage && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeMember(m.user._id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
        {canManage && (
          <form className="invite-form" onSubmit={invite}>
            <h3>Invite by email</h3>
            <div className="invite-row">
              <input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Invite
              </button>
            </div>
          </form>
        )}
      </section>

      {isOwner && (
        <section className="card danger-zone">
          <h2>Danger zone</h2>
          <p>Permanently delete this project and all associated tasks, sprints, and comments.</p>
          <button type="button" className="btn btn-danger" onClick={deleteProject}>
            Delete project
          </button>
        </section>
      )}

      <style>{`
        .settings-page {
          padding: 1rem 1.5rem 3rem;
          max-width: 720px;
          margin: 0 auto;
        }
        .settings-page h1 { font-size: 1.35rem; margin: 0 0 1rem; }
        .settings-page h2 { font-size: 1.05rem; margin: 0 0 0.75rem; }
        .settings-page h3 { font-size: 0.95rem; margin: 1rem 0 0.5rem; }
        .settings-page section { margin-bottom: 1.25rem; }
        .settings-page form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .settings-page label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .hint {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0 0 1rem;
          line-height: 1.45;
        }
        .ok { color: var(--success); margin: 0 0 0.75rem; }
        .form-error {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          margin: 0 0 0.75rem;
          font-size: 0.9rem;
        }
        .member-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem;
        }
        .member-list li {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 0.5rem;
          align-items: center;
          padding: 0.6rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }
        @media (max-width: 640px) {
          .member-list li {
            grid-template-columns: 1fr;
          }
        }
        .member-list .email {
          color: var(--muted);
          font-size: 0.8rem;
        }
        .member-list .role {
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          color: var(--accent);
        }
        .invite-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .invite-row input { flex: 1; min-width: 180px; }
        .invite-row select { width: 120px; }
        .btn-sm { padding: 0.35rem 0.65rem; font-size: 0.8rem; }
        .danger-zone {
          border-color: rgba(239, 68, 68, 0.35);
        }
        .danger-zone p {
          color: var(--muted);
          font-size: 0.9rem;
          margin: 0 0 0.75rem;
        }
      `}</style>
    </div>
  );
}
