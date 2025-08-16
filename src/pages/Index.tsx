import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskCard } from '@/components/TaskCard';
import { AddTaskForm } from '@/components/AddTaskForm';
import { TaskStats } from '@/components/TaskStats';
import { ThemeToggle } from '@/components/ThemeToggle';
import { EditTaskDialog } from '@/components/EditTaskDialog';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  CheckSquare,
  Square,
  LayoutGrid,
  List,
  LogOut,
  User,
  Bell,
  BellRing
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { 
    tasks, 
    loading: tasksLoading, 
    addTask, 
    toggleTaskComplete, 
    updateTask, 
    deleteTask 
  } = useTasks();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [showNotifications, setShowNotifications] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Derived data
  const projects = useMemo(() => {
    const projectSet = new Set(tasks.map(task => task.project).filter(Boolean));
    return Array.from(projectSet) as string[];
  }, [tasks]);

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

  const handleAddTask = async (newTask: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    await addTask(newTask);
    setShowAddForm(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSaveEditedTask = async (updatedTask: Task) => {
    await updateTask(updatedTask.id, updatedTask);
    setEditingTask(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPriority('all');
    setFilterProject('all');
    setFilterStatus('all');
  };

  const activeFiltersCount = [searchTerm, filterPriority !== 'all', filterProject !== 'all', filterStatus !== 'all']
    .filter(Boolean).length;

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg safe-area-padding">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`rounded-xl p-2 transition-all duration-300 ${
                  !theme ? 'bg-primary/10' :
                  theme === 'dark' ? 'bg-slate-800 shadow-md' :
                  theme === 'ocean' ? 'bg-blue-500/20 shadow-blue-500/20 shadow-lg' :
                  theme === 'forest' ? 'bg-green-500/20 shadow-green-500/20 shadow-lg' :
                  theme === 'sunset' ? 'bg-orange-500/20 shadow-orange-500/20 shadow-lg' :
                  'bg-primary/10'
                }`}>
                  <img 
                    src="/lovable-uploads/80f966c5-4aaf-420d-898b-4d30d3e0903b.png" 
                    alt="ToTodo Logo" 
                    className={`h-8 w-8 sm:h-12 sm:w-12 object-contain transition-all duration-300 ${
                      !theme ? 'brightness-100' :
                      theme === 'dark' ? 'invert brightness-110' :
                      theme === 'ocean' ? 'hue-rotate-180 saturate-150 brightness-110' :
                      theme === 'forest' ? 'hue-rotate-90 saturate-120 brightness-90' :
                      theme === 'sunset' ? 'hue-rotate-15 saturate-150 brightness-105' :
                      'brightness-100'
                    }`}
                  />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                    ToTodo
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Welcome back, {profile?.display_name || user.email}
                  </p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your productivity companion for managing tasks and projects
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ThemeToggle />
              <Button
                onClick={() => setShowNotifications(true)}
                variant="outline"
                size="sm"
                className="touch-target p-2"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                size="sm"
                className="touch-target p-2"
                aria-label="Profile"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="touch-target p-2"
                aria-label="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
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
              onAddTask={handleAddTask}
              onCancel={() => setShowAddForm(false)}
              projects={projects}
            />
          </div>
        )}

        {/* Edit Task Dialog */}
        <EditTaskDialog
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEditedTask}
          projects={projects}
        />

        {/* Notification Center */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

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
          {tasksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
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
                  onEdit={handleEditTask}
                  onDelete={deleteTask}
                  className={viewMode === 'grid' ? 'h-fit' : ''}
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