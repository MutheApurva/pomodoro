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
import { Plus, Clock, CheckCircle, Trash2, Edit } from 'lucide-react';
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
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tasks = tasksData?.tasks || [];
  const activeTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description"
                />
              </div>
              <div>
                <Label htmlFor="estimated">Estimated Pomodoros</Label>
                <Input
                  id="estimated"
                  type="number"
                  min="1"
                  value={newTask.estimatedPomodoros}
                  onChange={(e) => setNewTask({ ...newTask, estimatedPomodoros: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Tasks */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700">Active Tasks ({activeTasks.length})</h3>
        {activeTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No active tasks. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeTasks.map((task) => (
              <Card key={task.id} className="transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Checkbox
                          checked={task.isCompleted}
                          onCheckedChange={(checked) => 
                            handleUpdateTask(task, { isCompleted: !!checked })
                          }
                        />
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                          </span>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getProgressColor(task.completedPomodoros, task.estimatedPomodoros)}`}
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
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Completed Tasks ({completedTasks.length})</h3>
          <div className="grid gap-4">
            {completedTasks.map((task) => (
              <Card key={task.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <h4 className="font-semibold text-lg line-through">{task.title}</h4>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {task.completedPomodoros} pomodoros completed
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-estimated">Estimated Pomodoros</Label>
                <Input
                  id="edit-estimated"
                  type="number"
                  min="1"
                  value={editingTask.estimatedPomodoros}
                  onChange={(e) => setEditingTask({ ...editingTask, estimatedPomodoros: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleUpdateTask(editingTask, {
                    title: editingTask.title,
                    description: editingTask.description,
                    estimatedPomodoros: editingTask.estimatedPomodoros,
                  })}
                  disabled={updateTaskMutation.isPending}
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
