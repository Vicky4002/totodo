import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TaskCard, Task } from '@/components/TaskCard';
import { AddTaskForm } from '@/components/AddTaskForm';
import { TaskStats } from '@/components/TaskStats';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useTaskNotifications } from '@/hooks/use-task-notifications';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  CheckSquare,
  Square,
  LayoutGrid,
  List
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Index = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Design new landing page',
      description: 'Create a modern, responsive landing page for the product launch',
      completed: false,
      priority: 'high',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      project: 'Website Redesign',
      tags: ['design', 'frontend'],
      createdAt: '2024-08-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Review code submissions',
      description: 'Go through pending pull requests and provide feedback',
      completed: true,
      priority: 'medium',
      project: 'Development',
      tags: ['code-review', 'backend'],
      createdAt: '2024-08-01T09:00:00Z'
    },
    {
      id: '3',
      title: 'Update documentation',
      description: 'Update API documentation with new endpoints',
      completed: false,
      priority: 'low',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
      project: 'Documentation',
      tags: ['docs'],
      createdAt: '2024-08-01T08:00:00Z'
    },
    {
      id: '4',
      title: 'Client meeting preparation',
      description: 'Prepare presentation and demo for client meeting',
      completed: false,
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0], // Today
      project: 'Sales',
      tags: ['meeting', 'client'],
      createdAt: '2024-08-01T07:00:00Z'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  // Derived data
  const projects = useMemo(() => {
    const projectSet = new Set(tasks.map(task => task.project).filter(Boolean));
    return Array.from(projectSet) as string[];
  }, [tasks]);

  // Task notifications
  const { dueSoonTasks, overdueTasks } = useTaskNotifications({ 
    tasks, 
    enabled: true 
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesProject = filterProject === 'all' || task.project === filterProject;
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'completed' && task.completed) ||
                           (filterStatus === 'pending' && !task.completed);

      return matchesSearch && matchesPriority && matchesProject && matchesStatus;
    });
  }, [tasks, searchTerm, filterPriority, filterProject, filterStatus]);

  const addTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setTasks(prev => [task, ...prev]);
    setShowAddForm(false);
    
    toast({
      title: "Task created!",
      description: `"${task.title}" has been added to your list.`,
    });
  };

  const toggleTaskComplete = (id: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        
        if (completed) {
          toast({
            title: "Task completed! 🎉",
            description: `"${task.title}" marked as done.`,
          });
        }
        
        return { ...task, completed };
      }
      return task;
    }));
  };

  const editTask = (task: Task) => {
    // For now, just show a toast - you could implement an edit modal
    toast({
      title: "Edit Task",
      description: "Edit functionality coming soon!",
    });
  };

  const deleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    
    if (task) {
      toast({
        title: "Task deleted",
        description: `"${task.title}" has been removed.`,
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPriority('all');
    setFilterProject('all');
    setFilterStatus('all');
  };

  const activeFiltersCount = [searchTerm, filterPriority !== 'all', filterProject !== 'all', filterStatus !== 'all']
    .filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-bg safe-area-padding">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                ToTodo
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your productivity companion for managing tasks and projects
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <NotificationBadge 
                dueSoonTasks={dueSoonTasks} 
                overdueTasks={overdueTasks}
                onTaskClick={(task) => {
                  // Scroll to task or highlight it
                  const taskElement = document.getElementById(`task-${task.id}`);
                  if (taskElement) {
                    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    taskElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                    setTimeout(() => {
                      taskElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 2000);
                  }
                }}
              />
              <ThemeToggle />
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="shadow-soft touch-target flex-1 sm:flex-none"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Add Task</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <TaskStats tasks={tasks} />
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <div className="mb-8">
            <AddTaskForm
              onAddTask={addTask}
              onCancel={() => setShowAddForm(false)}
              projects={projects}
            />
          </div>
        )}

        {/* Filters & Search */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-200 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
            </div>

            <Select value={filterStatus} onValueChange={(value: 'all' | 'pending' | 'completed') => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            {projects.length > 0 && (
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
              </h3>
              <p className="text-muted-foreground">
                {tasks.length === 0 
                  ? 'Create your first task to get started!'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={toggleTaskComplete}
                  onEdit={editTask}
                  onDelete={deleteTask}
                  className={cn(
                    viewMode === 'grid' ? 'h-fit' : '',
                    'transition-all duration-200'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;