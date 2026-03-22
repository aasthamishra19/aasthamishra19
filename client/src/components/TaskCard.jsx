import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const priorityColor = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export default function TaskCard({ task, projectKey, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="task-card" {...attributes}>
      <button type="button" className="task-drag" aria-label="Drag task" {...listeners}>
        ⋮⋮
      </button>
      <div
        className="task-card-body"
        role="button"
        tabIndex={0}
        onClick={() => onOpen(task)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(task);
          }
        }}
      >
      <div className="task-card-top">
        <span className="task-id">
          {projectKey}-{task._id.slice(-4).toUpperCase()}
        </span>
        <span
          className="task-priority"
          style={{ background: priorityColor[task.priority] || priorityColor.medium }}
        />
      </div>
      <div className="task-title">{task.title}</div>
      {task.assignee && (
        <div className="task-assignee">{task.assignee.name || task.assignee.email}</div>
      )}
      </div>
      <style>{`
        .task-card {
          display: flex;
          gap: 0.35rem;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.65rem 0.5rem 0.35rem;
          margin-bottom: 0.5rem;
          text-align: left;
        }
        .task-drag {
          flex-shrink: 0;
          width: 22px;
          border: none;
          background: transparent;
          color: var(--muted);
          cursor: grab;
          font-size: 0.65rem;
          line-height: 1;
          padding: 0.25rem 0;
          border-radius: 4px;
        }
        .task-drag:hover { background: var(--surface); color: var(--text); }
        .task-drag:active { cursor: grabbing; }
        .task-card-body {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
        .task-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.35rem;
        }
        .task-id {
          font-size: 0.65rem;
          color: var(--muted);
          font-weight: 600;
        }
        .task-priority {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .task-title {
          font-size: 0.88rem;
          font-weight: 500;
          line-height: 1.35;
        }
        .task-assignee {
          margin-top: 0.4rem;
          font-size: 0.75rem;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
