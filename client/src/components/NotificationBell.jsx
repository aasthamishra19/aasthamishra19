import { useEffect, useState, useRef } from 'react';
import { api } from '../api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  async function load() {
    try {
      const d = await api('/api/notifications');
      setItems(d.notifications || []);
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markRead(id) {
    await api(`/api/notifications/${id}/read`, { method: 'PATCH' });
    load();
  }

  async function markAll() {
    await api('/api/notifications/read-all', { method: 'POST' });
    load();
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        type="button"
        className="notif-btn btn btn-ghost"
        onClick={() => {
          setOpen(!open);
          if (!open) load();
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown card">
          <div className="notif-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="link-btn" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          <ul className="notif-list">
            {items.length === 0 && <li className="notif-empty">No notifications yet</li>}
            {items.map((n) => (
              <li key={n._id} className={n.read ? '' : 'unread'}>
                <button
                  type="button"
                  className="notif-item"
                  onClick={() => {
                    if (!n.read) markRead(n._id);
                    if (n.project?._id) {
                      window.location.href = n.task?._id
                        ? `/p/${n.project._id}?task=${n.task._id}`
                        : `/p/${n.project._id}`;
                    }
                  }}
                >
                  <span className="notif-title">{n.title}</span>
                  <span className="notif-msg">{n.message}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <style>{`
        .notif-wrap {
          position: relative;
        }
        .notif-btn {
          position: relative;
          padding: 0.4rem 0.65rem;
          font-size: 1.1rem;
        }
        .notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--danger);
          color: white;
          font-size: 0.65rem;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .notif-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 320px;
          max-height: 380px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 200;
          padding: 0;
        }
        .notif-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .link-btn {
          background: none;
          border: none;
          color: var(--accent);
          font-size: 0.8rem;
          cursor: pointer;
        }
        .notif-list {
          list-style: none;
          margin: 0;
          padding: 0;
          overflow-y: auto;
          max-height: 300px;
        }
        .notif-empty {
          padding: 1.5rem;
          text-align: center;
          color: var(--muted);
          font-size: 0.9rem;
        }
        .notif-item {
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          border-bottom: 1px solid var(--border);
          padding: 0.75rem 1rem;
          color: inherit;
          cursor: pointer;
        }
        .notif-item:hover {
          background: var(--surface2);
        }
        li.unread .notif-item {
          background: rgba(59, 130, 246, 0.08);
        }
        .notif-title {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .notif-msg {
          display: block;
          color: var(--muted);
          font-size: 0.8rem;
          margin-top: 0.2rem;
        }
      `}</style>
    </div>
  );
}
