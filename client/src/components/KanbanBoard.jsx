import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { api } from '../api';
import TaskCard from './TaskCard.jsx';

function Column({ column, children, taskIds, quickValue, onQuickChange, onQuickAdd, canEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div ref={setNodeRef} className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}>
      <div className="kanban-column-head">
        <h3>{column.title}</h3>
        <span className="count">{taskIds.length}</span>
      </div>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">{children}</div>
      </SortableContext>
      {canEdit && (
        <div className="kanban-quick" onPointerDown={(e) => e.stopPropagation()}>
          <input
            placeholder="Quick add…"
            value={quickValue || ''}
            onChange={(e) => onQuickChange(column.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onQuickAdd(column.id);
              }
            }}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onQuickAdd(column.id)}>
            Add
          </button>
        </div>
      )}
      <style>{`
        .kanban-column {
          min-width: 280px;
          max-width: 320px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 200px);
        }
        .kanban-column-over {
          outline: 2px dashed var(--accent);
          outline-offset: 2px;
        }
        .kanban-column-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .kanban-column-head h3 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .count {
          font-size: 0.75rem;
          color: var(--muted);
          background: var(--surface2);
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
        }
        .kanban-column-body {
          padding: 0.65rem;
          overflow-y: auto;
          flex: 1;
        }
        .kanban-quick {
          display: flex;
          gap: 0.35rem;
          padding: 0.5rem 0.65rem 0.65rem;
          border-top: 1px solid var(--border);
        }
        .kanban-quick input {
          flex: 1;
          font-size: 0.85rem;
          padding: 0.4rem 0.5rem;
        }
        .btn-sm {
          padding: 0.4rem 0.65rem;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}

function applyDrag(tasks, activeId, overId, columns) {
  const active = tasks.find((t) => t._id === activeId);
  if (!active) return tasks;
  const overIsColumn = columns.some((c) => c.id === overId);
  const overTask = tasks.find((t) => t._id === overId);
  const targetCol = overIsColumn ? overId : overTask?.columnId;
  if (!targetCol) return tasks;

  const others = tasks.filter((t) => t._id !== activeId);
  let colTasks = others.filter((t) => t.columnId === targetCol).sort((a, b) => a.order - b.order);

  let insertAt = colTasks.length;
  if (overTask && overTask._id !== activeId) {
    insertAt = colTasks.findIndex((t) => t._id === overId);
    if (insertAt < 0) insertAt = colTasks.length;
  }

  const moved = { ...active, columnId: targetCol };
  colTasks.splice(insertAt, 0, moved);

  const byCol = {};
  for (const c of columns) byCol[c.id] = [];
  for (const t of others) {
    if (t.columnId === targetCol) continue;
    if (!byCol[t.columnId]) byCol[t.columnId] = [];
    byCol[t.columnId].push(t);
  }
  byCol[targetCol] = colTasks;

  const out = [];
  for (const c of columns) {
    const list = (byCol[c.id] || []).sort((a, b) => a.order - b.order);
    list.forEach((t, i) => {
      out.push({ ...t, columnId: c.id, order: i });
    });
  }
  return out;
}

export default function KanbanBoard({
  columns,
  tasks,
  setTasks,
  projectId,
  projectKey,
  canEdit,
  onOpenTask,
  onTasksChanged,
  quickTitle,
  onQuickTitleChange,
  onQuickAdd,
}) {
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [columns]
  );

  const tasksByColumn = useMemo(() => {
    const m = {};
    for (const c of sortedColumns) m[c.id] = [];
    for (const t of tasks) {
      if (!m[t.columnId]) m[t.columnId] = [];
      m[t.columnId].push(t);
    }
    for (const id of Object.keys(m)) {
      m[id].sort((a, b) => a.order - b.order);
    }
    return m;
  }, [tasks, sortedColumns]);

  const activeTask = activeId ? tasks.find((t) => t._id === activeId) : null;

  async function persistReorder(nextTasks) {
    const reorderBatch = nextTasks.map((t) => ({
      id: t._id,
      columnId: t.columnId,
      order: t.order,
    }));
    try {
      const first = nextTasks[0];
      if (!first) return;
      const d = await api(`/api/tasks/${first._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ reorderBatch }),
      });
      setTasks(d.tasks || []);
      onTasksChanged?.();
    } catch (e) {
      console.error(e);
      const d = await api(`/api/tasks/project/${projectId}`);
      setTasks(d.tasks || []);
    }
  }

  function onDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || !canEdit) return;
    const activeTaskId = active.id;
    const overId = over.id;
    if (activeTaskId === overId) return;
    const next = applyDrag(tasks, activeTaskId, overId, sortedColumns);
    setTasks(next);
    persistReorder(next);
  }

  return (
    <div className="kanban-wrap">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="kanban-scroll">
          {sortedColumns.map((col) => {
            const colTasks = tasksByColumn[col.id] || [];
            const ids = colTasks.map((t) => t._id);
            return (
              <Column
                key={col.id}
                column={col}
                taskIds={ids}
                quickValue={quickTitle?.[col.id]}
                onQuickChange={onQuickTitleChange}
                onQuickAdd={onQuickAdd}
                canEdit={canEdit}
              >
                {colTasks.map((t) => (
                  <TaskCard key={t._id} task={t} projectKey={projectKey} onOpen={onOpenTask} />
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="task-card-overlay card">
              <span className="oid">
                {projectKey}-{activeTask._id.slice(-4).toUpperCase()}
              </span>
              <div className="ot">{activeTask.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <style>{`
        .kanban-wrap {
          flex: 1;
          min-height: 0;
        }
        .kanban-scroll {
          display: flex;
          gap: 1rem;
          padding: 0 0.25rem 1rem 0;
          overflow-x: auto;
          align-items: flex-start;
        }
        .task-card-overlay {
          padding: 0.75rem 1rem;
          max-width: 280px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        }
        .task-card-overlay .oid {
          font-size: 0.65rem;
          color: var(--muted);
          font-weight: 600;
        }
        .task-card-overlay .ot {
          font-size: 0.9rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}
