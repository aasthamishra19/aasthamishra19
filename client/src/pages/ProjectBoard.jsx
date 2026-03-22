import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import KanbanBoard from '../components/KanbanBoard.jsx';
import TaskModal from '../components/TaskModal.jsx';

export default function ProjectBoard() {
  const { project, role, boardId, boards, reloadProject } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addCol, setAddCol] = useState('');
  const [quickTitle, setQuickTitle] = useState({});
  const taskIdOpen = searchParams.get('task');

  const board = boards?.[0];
  const columns = board?.columns || [];
  const canEdit = role === 'owner' || role === 'admin' || role === 'member';

  const usersForAssign = useMemo(() => {
    const u = [];
    if (project?.owner?._id) {
      u.push({
        id: project.owner._id,
        name: project.owner.name || project.owner.email,
      });
    }
    for (const m of project?.members || []) {
      if (m.user?._id) {
        u.push({
          id: m.user._id,
          name: m.user.name || m.user.email,
        });
      }
    }
    const seen = new Set();
    return u.filter((x) => {
      if (seen.has(x.id)) return false;
      seen.add(x.id);
      return true;
    });
  }, [project]);

  const loadTasks = useCallback(async () => {
    if (!project?._id) return;
    try {
      const d = await api(`/api/tasks/project/${project._id}`);
      setTasks(d.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [project?._id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function openTask(t) {
    setSearchParams({ task: t._id });
  }

  function closeTask() {
    setSearchParams({});
  }

  async function addTask(columnId) {
    const title = (quickTitle[columnId] || '').trim();
    if (!title || !boardId) return;
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          projectId: project._id,
          boardId,
          columnId,
          title,
        }),
      });
      setQuickTitle((q) => ({ ...q, [columnId]: '' }));
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  }

  async function addColumn(e) {
    e.preventDefault();
    if (!addCol.trim() || !board?._id) return;
    try {
      await api(`/api/boards/${board._id}/columns`, {
        method: 'POST',
        body: JSON.stringify({ title: addCol.trim() }),
      });
      setAddCol('');
      reloadProject?.();
    } catch (e) {
      console.error(e);
    }
  }

  if (!boardId || !board) {
    return <p style={{ padding: '1.5rem' }}>No board found for this project.</p>;
  }

  return (
    <div className="board-page">
      {loading ? (
        <p className="muted" style={{ padding: '1rem 1.5rem' }}>
          Loading board…
        </p>
      ) : (
        <KanbanBoard
          columns={columns}
          tasks={tasks}
          setTasks={setTasks}
          projectId={project._id}
          projectKey={project.key}
          canEdit={canEdit}
          onOpenTask={openTask}
          onTasksChanged={loadTasks}
          quickTitle={quickTitle}
          onQuickTitleChange={(colId, v) => setQuickTitle((q) => ({ ...q, [colId]: v }))}
          onQuickAdd={addTask}
        />
      )}
      {canEdit && (
        <form className="add-col-form" onSubmit={addColumn}>
          <input
            placeholder="New column name"
            value={addCol}
            onChange={(e) => setAddCol(e.target.value)}
          />
          <button type="submit" className="btn btn-ghost">
            Add column
          </button>
        </form>
      )}
      {taskIdOpen && (
        <TaskModal
          taskId={taskIdOpen}
          projectKey={project.key}
          canEdit={canEdit}
          usersForAssign={usersForAssign}
          onClose={closeTask}
          onUpdated={loadTasks}
        />
      )}
      <style>{`
        .board-page {
          padding: 1rem 1.25rem 2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .add-col-form {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .add-col-form input { max-width: 220px; }
        .muted { color: var(--muted); }
      `}</style>
    </div>
  );
}
