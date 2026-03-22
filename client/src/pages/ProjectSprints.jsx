import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api';

export default function ProjectSprints() {
  const { project, role } = useOutletContext();
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [err, setErr] = useState('');
  const canManage = role === 'owner' || role === 'admin';
  const canEdit = role === 'owner' || role === 'admin' || role === 'member';

  const load = useCallback(async () => {
    if (!project?._id) return;
    try {
      const [sp, tk] = await Promise.all([
        api(`/api/sprints/project/${project._id}`),
        api(`/api/tasks/project/${project._id}`),
      ]);
      setSprints(sp.sprints || []);
      setTasks(tk.tasks || []);
    } catch {
      setSprints([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [project?._id]);

  useEffect(() => {
    load();
  }, [load]);

  async function createSprint(e) {
    e.preventDefault();
    setErr('');
    try {
      await api('/api/sprints', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          name,
          goal,
          startDate: start,
          endDate: end,
        }),
      });
      setModal(false);
      setName('');
      setGoal('');
      setStart('');
      setEnd('');
      load();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function addTaskToSprint(sprintId, taskId) {
    if (!canEdit) return;
    try {
      await api(`/api/sprints/${sprintId}/tasks/${taskId}`, { method: 'POST' });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function removeTaskFromSprint(sprintId, taskId) {
    if (!canEdit) return;
    try {
      await api(`/api/sprints/${sprintId}/tasks/${taskId}`, { method: 'DELETE' });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteSprint(id) {
    if (!canManage || !confirm('Delete this sprint? Tasks will be unassigned from it.')) return;
    try {
      await api(`/api/sprints/${id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      console.error(e);
    }
  }

  const sprintIdOf = (t) => {
    const sp = t.sprint;
    if (!sp) return null;
    return typeof sp === 'object' && sp._id ? sp._id.toString() : sp.toString();
  };
  const backlog = tasks.filter((t) => !sprintIdOf(t));

  if (loading) {
    return <p style={{ padding: '1.5rem', color: 'var(--muted)' }}>Loading sprints…</p>;
  }

  return (
    <div className="sprints-page">
      <div className="sprints-toolbar">
        <h1>Sprints</h1>
        {canManage && (
          <button type="button" className="btn btn-primary" onClick={() => setModal(true)}>
            + New sprint
          </button>
        )}
      </div>
      <div className="sprints-grid">
        <section className="card backlog-section">
          <h2>Backlog</h2>
          <p className="hint">Tasks not in a sprint</p>
          <ul>
            {backlog.map((t) => (
              <li key={t._id}>
                <span>{t.title}</span>
              </li>
            ))}
            {backlog.length === 0 && <li className="empty-li">No backlog items</li>}
          </ul>
        </section>
        <div className="sprint-list">
          {sprints.map((s) => {
            const inSprint = tasks.filter((t) => sprintIdOf(t) === s._id.toString());
            return (
              <section key={s._id} className="card sprint-card">
                <div className="sprint-head">
                  <div>
                    <h2>{s.name}</h2>
                    <p className="dates">
                      {new Date(s.startDate).toLocaleDateString()} —{' '}
                      {new Date(s.endDate).toLocaleDateString()}
                    </p>
                    {s.goal && <p className="goal">{s.goal}</p>}
                  </div>
                  {canManage && (
                    <button type="button" className="btn btn-danger btn-tiny" onClick={() => deleteSprint(s._id)}>
                      Delete
                    </button>
                  )}
                </div>
                <ul>
                  {inSprint.map((t) => (
                    <li key={t._id}>
                      <span>{t.title}</span>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-tiny"
                          onClick={() => removeTaskFromSprint(s._id, t._id)}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                  {inSprint.length === 0 && <li className="empty-li">No tasks in this sprint</li>}
                </ul>
                {canManage && backlog.length > 0 && (
                  <div className="add-to-sprint">
                    <span>Add from backlog:</span>
                    <select
                      onChange={(e) => {
                        const tid = e.target.value;
                        if (tid) addTaskToSprint(s._id, tid);
                        e.target.value = '';
                      }}
                    >
                      <option value="">Choose task…</option>
                      {backlog.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </section>
            );
          })}
          {sprints.length === 0 && (
            <p className="muted">No sprints yet. {canManage ? 'Create one to plan work.' : ''}</p>
          )}
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog">
            <h2>New sprint</h2>
            <form onSubmit={createSprint}>
              {err && <div className="form-error">{err}</div>}
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label>
                Goal
                <textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
              </label>
              <label>
                Start
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
              </label>
              <label>
                End
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
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
        .sprints-page { padding: 1rem 1.5rem 2rem; max-width: 1100px; margin: 0 auto; }
        .sprints-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .sprints-toolbar h1 { margin: 0; font-size: 1.35rem; }
        .sprints-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 800px) {
          .sprints-grid { grid-template-columns: 1fr; }
        }
        .backlog-section h2, .sprint-card h2 { margin: 0 0 0.35rem; font-size: 1rem; }
        .hint { font-size: 0.8rem; color: var(--muted); margin: 0 0 0.75rem; }
        .backlog-section ul, .sprint-card ul {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 320px;
          overflow-y: auto;
        }
        .backlog-section li, .sprint-card li {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }
        .empty-li { color: var(--muted); border: none; }
        .sprint-list { display: flex; flex-direction: column; gap: 1rem; }
        .sprint-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .dates { font-size: 0.8rem; color: var(--muted); margin: 0.2rem 0; }
        .goal { font-size: 0.85rem; margin: 0.35rem 0 0; color: var(--text); }
        .btn-tiny { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
        .add-to-sprint {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--muted);
        }
        .muted { color: var(--muted); }
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
        .modal { width: 100%; max-width: 400px; }
        .modal h2 { margin-top: 0; }
        .modal form { display: flex; flex-direction: column; gap: 0.85rem; }
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
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
