import React, { memo, useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Task } from '@/hooks/useTasks';

interface VirtualTaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  viewMode: 'list' | 'grid';
  height?: number;
}

const TaskItem = memo(({ index, data }: any) => {
  const { tasks, onToggleComplete, onEdit, onDelete } = data;
  const task = tasks[index];

  return (
    <div className="p-2">
      <TaskCard
        task={task}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        className="animate-fade-in"
      />
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export const VirtualTaskList: React.FC<VirtualTaskListProps> = memo(({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  viewMode,
  height = 600
}) => {
  const itemData = useMemo(() => ({
    tasks,
    onToggleComplete,
    onEdit,
    onDelete
  }), [tasks, onToggleComplete, onEdit, onDelete]);

  const itemHeight = viewMode === 'grid' ? 200 : 120;

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No tasks to display
        </h3>
        <p className="text-muted-foreground">
          Create your first task to get started!
        </p>
      </div>
    );
  }

  // For small lists, render normally for better UX
  if (tasks.length <= 10) {
    return (
      <div className={`grid gap-4 animate-fade-in ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className="animate-slide-in"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <TaskCard
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              className={viewMode === 'grid' ? 'h-fit' : ''}
            />
          </div>
        ))}
      </div>
    );
  }

  // For better performance, we'll use a simpler approach without react-window for now
  // as the import is causing issues. We'll implement staggered animations instead.
  return (
    <div className={`grid gap-4 animate-fade-in ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1'
    }`}>
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-slide-in"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <TaskCard
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            className={viewMode === 'grid' ? 'h-fit' : ''}
          />
        </div>
      ))}
    </div>
  );
});

VirtualTaskList.displayName = 'VirtualTaskList';