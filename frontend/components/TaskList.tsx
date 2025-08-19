import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Clock, CheckCircle, Trash2, Edit, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task } from '~backend/pomodoro/types';

export function TaskList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    estimatedPomodoros: 1,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => backend.pomodoro.listTasks(),
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; description?: string; estimatedPomodoros: number }) =>
      backend.pomodoro.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setIsCreateDialogOpen(false);
      setNewTask({ title: '', description: '', estimatedPomodoros: 1 });
      toast({
        title: 'Success',
        description: 'Task created successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (data: { id: number; title?: string; description?: string; estimatedPomodoros?: number; isCompleted?: boolean }) =>
      backend.pomodoro.updateTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      setEditingTask(null);
      toast({
        title: 'Success',
        description: 'Task updated successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => backend.pomodoro.deleteTask({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      toast({
        title: 'Success',
        description: 'Task deleted successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to delete task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required.',
        variant: 'destructive',
      });
      return;
    }

    createTaskMutation.mutate({
      title: newTask.title.trim(),
      description: newTask.description.trim() || undefined,
      estimatedPomodoros: newTask.estimatedPomodoros,
    });
  };

  const handleUpdateTask = (task: Task, updates: Partial<Task>) => {
    updateTaskMutation.mutate({
      id: task.id,
      ...updates,
    });
  };

  const handleDeleteTask = (id: number) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const getProgressColor = (completed: number, estimated: number): string => {
    const percentage = (completed / estimated) * 100;
    if (percentage >= 100) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    if (percentage >= 75) return 'bg-gradient-to-r from-cyan-400 to-cyan-500';
    if (percentage >= 50) return 'bg-gradient-to-r from-violet-400 to-violet-500';
    return 'bg-gradient-to-r from-slate-400 to-slate-500';
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  const tasks = tasksData?.tasks || [];
  const activeTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <Target className="w-8 h-8" />
          Tasks
        </h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600/80 hover:to-cyan-600/80 backdrop-blur-sm border border-emerald-400/30 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-slate-300">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-slate-300">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
                />
              </div>
              <div>
                <Label htmlFor="estimated" className="text-slate-300">Estimated Pomodoros</Label>
                <Input
                  id="estimated"
                  type="number"
                  min="1"
                  value={newTask.estimatedPomodoros}
                  onChange={(e) => setNewTask({ ...newTask, estimatedPomodoros: parseInt(e.target.value) || 1 })}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-white/20 text-slate-300 hover:bg-white/10">
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200">Active Tasks ({activeTasks.length})</h3>
        {activeTasks.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <p className="text-slate-400">No active tasks. Create one to get started!</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeTasks.map((task) => (
              <div key={task.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl transition-all hover:bg-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={(checked) => 
                          handleUpdateTask(task, { isCompleted: !!checked })
                        }
                        className="border-white/30 data-[state=checked]:bg-emerald-500"
                      />
                      <h4 className="font-semibold text-lg text-white">{task.title}</h4>
                    </div>
                    {task.description && (
                      <p className="text-slate-400 mb-4">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">
                          {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                        </span>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-white/10 rounded-full h-3 backdrop-blur-sm">
                          <div
                            className={`h-3 rounded-full transition-all ${getProgressColor(task.completedPomodoros, task.estimatedPomodoros)}`}
                            style={{
                              width: `${Math.min((task.completedPomodoros / task.estimatedPomodoros) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-200">Completed Tasks ({completedTasks.length})</h3>
          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <div key={task.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl opacity-60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-semibold text-lg line-through text-slate-400">{task.title}</h4>
                      <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                        Completed
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-slate-500 mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-500">
                        {task.completedPomodoros} pomodoros completed
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-white/5 hover:bg-white/10 backdrop-blur-sm border-white/10 text-slate-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-slate-300">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-slate-300">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-estimated" className="text-slate-300">Estimated Pomodoros</Label>
                <Input
                  id="edit-estimated"
                  type="number"
                  min="1"
                  value={editingTask.estimatedPomodoros}
                  onChange={(e) => setEditingTask({ ...editingTask, estimatedPomodoros: parseInt(e.target.value) || 1 })}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTask(null)} className="border-white/20 text-slate-300 hover:bg-white/10">
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateTask(editingTask, {
                    title: editingTask.title,
                    description: editingTask.description,
                    estimatedPomodoros: editingTask.estimatedPomodoros,
                  })}
                  disabled={updateTaskMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                >
                  {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
