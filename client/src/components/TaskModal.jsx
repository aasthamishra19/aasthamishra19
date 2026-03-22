import { useEffect, useState, useMemo } from 'react';
import { api, assetUrl } from '../api';

export default function TaskModal({
  taskId,
  projectKey,
  canEdit,
  usersForAssign,
  onClose,
  onUpdated,
}) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        api(`/api/tasks/${taskId}`),
        api(`/api/comments/task/${taskId}`),
      ]);
      setTask(t.task);
      setComments(c.comments || []);
      setTitle(t.task.title);
      setDescription(t.task.description || '');
      setPriority(t.task.priority || 'medium');
      setAssigneeId(t.task.assignee?._id || '');
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [taskId]);

  const displayId = useMemo(() => {
    if (!task) return '';
    return `${projectKey}-${task._id.slice(-4).toUpperCase()}`;
  }, [task, projectKey]);

  async function saveFields() {
    if (!canEdit) return;
    setErr('');
    try {
      const d = await api(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description,
          priority,
          assigneeId: assigneeId || null,
        }),
      });
      setTask(d.task);
      onUpdated?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setErr('');
    try {
      await api('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ taskId, body }),
      });
      setBody('');
      const c = await api(`/api/comments/task/${taskId}`);
      setComments(c.comments || []);
      onUpdated?.();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    const fd = new FormData();
    fd.append('file', file);
    setErr('');
    try {
      const d = await api(`/api/tasks/${taskId}/attachments`, { method: 'POST', body: fd });
      setTask(d.task);
      e.target.value = '';
      onUpdated?.();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function removeTask() {
    if (!canEdit || !confirm('Delete this task?')) return;
    try {
      await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
      onUpdated?.();
      onClose();
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="tm-back" role="presentation" onClick={onClose}>
      <div className="tm-modal card" role="dialog" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tm-close btn btn-ghost" onClick={onClose}>
          ×
        </button>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !task ? (
          <p>{err || 'Task not found'}</p>
        ) : (
          <>
            <div className="tm-head">
              <span className="tm-id">{displayId}</span>
              {canEdit ? (
                <input
                  className="tm-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveFields}
                />
              ) : (
                <h2>{task.title}</h2>
              )}
            </div>
            {err && <div className="form-error">{err}</div>}
            <div className="tm-grid">
              <div className="tm-main">
                <label className="tm-label">Description</label>
                {canEdit ? (
                  <textarea
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={saveFields}
                  />
                ) : (
                  <p className="tm-desc">{task.description || 'No description'}</p>
                )}

                <label className="tm-label">Attachments</label>
                {canEdit && (
                  <input type="file" onChange={onUpload} style={{ fontSize: '0.85rem' }} />
                )}
                <ul className="tm-files">
                  {(task.attachments || []).map((a, i) => (
                    <li key={i}>
                      <a href={assetUrl(a.path)} target="_blank" rel="noreferrer">
                        {a.originalName || a.filename}
                      </a>
                    </li>
                  ))}
                </ul>

                <label className="tm-label">Comments</label>
                <ul className="tm-comments">
                  {comments.map((c) => (
                    <li key={c._id}>
                      <strong>{c.author?.name || 'User'}</strong>
                      <span className="tm-cdate">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                      <p>{c.body}</p>
                    </li>
                  ))}
                </ul>
                <form onSubmit={addComment} className="tm-comment-form">
                  <textarea
                    rows={2}
                    placeholder="Add a comment…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!body.trim()}>
                    Comment
                  </button>
                </form>
              </div>
              <aside className="tm-side">
                <label className="tm-label">Priority</label>
                {canEdit ? (
                  <select
                    value={priority}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPriority(v);
                      api(`/api/tasks/${taskId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ priority: v }),
                      })
                        .then((d) => setTask(d.task))
                        .then(() => onUpdated?.());
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <p>{task.priority}</p>
                )}

                <label className="tm-label">Assignee</label>
                {canEdit ? (
                  <select
                    value={assigneeId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAssigneeId(v);
                      api(`/api/tasks/${taskId}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ assigneeId: v || null }),
                      })
                        .then((d) => setTask(d.task))
                        .then(() => onUpdated?.());
                    }}
                  >
                    <option value="">Unassigned</option>
                    {usersForAssign.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>{task.assignee?.name || 'Unassigned'}</p>
                )}

                <label className="tm-label">Reporter</label>
                <p>{task.reporter?.name || '—'}</p>

                {canEdit && (
                  <button type="button" className="btn btn-danger" style={{ marginTop: '1rem' }} onClick={removeTask}>
                    Delete task
                  </button>
                )}
              </aside>
            </div>
          </>
        )}
      </div>
      <style>{`
        .tm-back {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          z-index: 150;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2rem 1rem;
          overflow-y: auto;
        }
        .tm-modal {
          position: relative;
          width: 100%;
          max-width: 880px;
          margin-bottom: 2rem;
        }
        .tm-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          font-size: 1.5rem;
          line-height: 1;
          padding: 0.2rem 0.5rem;
        }
        .tm-head { padding-right: 2.5rem; margin-bottom: 1rem; }
        .tm-id {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
        }
        .tm-head h2 { margin: 0.35rem 0 0; font-size: 1.35rem; }
        .tm-title-input {
          font-size: 1.35rem;
          font-weight: 600;
          margin-top: 0.35rem;
          border: 1px solid transparent;
          background: var(--surface2);
        }
        .tm-title-input:focus { border-color: var(--accent); }
        .tm-grid {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 1.5rem;
        }
        @media (max-width: 720px) {
          .tm-grid { grid-template-columns: 1fr; }
        }
        .tm-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 1rem 0 0.35rem;
        }
        .tm-label:first-child { margin-top: 0; }
        .tm-desc { color: var(--muted); margin: 0; }
        .tm-files { list-style: none; padding: 0; margin: 0; font-size: 0.9rem; }
        .tm-files li { margin-bottom: 0.35rem; }
        .tm-comments {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem;
          max-height: 220px;
          overflow-y: auto;
        }
        .tm-comments li {
          border-bottom: 1px solid var(--border);
          padding: 0.65rem 0;
          font-size: 0.9rem;
        }
        .tm-comments strong { margin-right: 0.5rem; }
        .tm-cdate { font-size: 0.75rem; color: var(--muted); }
        .tm-comments p { margin: 0.35rem 0 0; color: var(--text); }
        .tm-comment-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .tm-side p { margin: 0; font-size: 0.9rem; }
        .form-error {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          padding: 0.6rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }
        .muted { color: var(--muted); }
      `}</style>
    </div>
  );
}
