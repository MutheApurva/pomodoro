import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task, UserSettings } from '~backend/pomodoro/types';

type TimerState = 'idle' | 'running' | 'paused';
type SessionType = 'work' | 'short_break' | 'long_break';

export function Timer() {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.pomodoro.getSettings(),
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => backend.pomodoro.listTasks(),
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: (data: { taskId?: number; sessionType: SessionType; durationMinutes: number }) =>
      backend.pomodoro.completeSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    onError: (error) => {
      console.error('Failed to complete session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save session. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update timer when settings change
  useEffect(() => {
    if (settings && timerState === 'idle') {
      const duration = getDurationForSessionType(sessionType, settings);
      setTimeLeft(duration * 60);
    }
  }, [settings, sessionType, timerState]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, timeLeft]);

  const getDurationForSessionType = (type: SessionType, settings: UserSettings): number => {
    switch (type) {
      case 'work':
        return settings.workDuration;
      case 'short_break':
        return settings.shortBreakDuration;
      case 'long_break':
        return settings.longBreakDuration;
      default:
        return 25;
    }
  };

  const handleTimerComplete = async () => {
    setTimerState('idle');
    
    if (!settings) return;

    const duration = getDurationForSessionType(sessionType, settings);
    
    // Save the completed session
    await completeSessionMutation.mutateAsync({
      taskId: sessionType === 'work' ? selectedTaskId : undefined,
      sessionType,
      durationMinutes: duration,
    });

    // Show completion notification
    toast({
      title: `${sessionType === 'work' ? 'Work' : 'Break'} session completed!`,
      description: `Great job! You completed a ${duration}-minute ${sessionType.replace('_', ' ')} session.`,
    });

    // Auto-advance to next session type
    if (sessionType === 'work') {
      const newCompletedSessions = completedWorkSessions + 1;
      setCompletedWorkSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        setSessionType('long_break');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setSessionType('short_break');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
    } else {
      setSessionType('work');
      setTimeLeft(settings.workDuration * 60);
    }
  };

  const handleStart = () => {
    setTimerState('running');
  };

  const handlePause = () => {
    setTimerState('paused');
  };

  const handleStop = () => {
    setTimerState('idle');
    if (settings) {
      const duration = getDurationForSessionType(sessionType, settings);
      setTimeLeft(duration * 60);
    }
  };

  const handleReset = () => {
    setTimerState('idle');
    setCompletedWorkSessions(0);
    setSessionType('work');
    if (settings) {
      setTimeLeft(settings.workDuration * 60);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!settings) return 0;
    const totalDuration = getDurationForSessionType(sessionType, settings) * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getSessionTypeColor = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return 'from-red-400 to-red-600';
      case 'short_break':
        return 'from-green-400 to-green-600';
      case 'long_break':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading timer settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${getSessionTypeColor(sessionType)} text-white`}>
          <CardTitle className="text-center text-2xl font-bold">
            {sessionType === 'work' ? 'Work Session' : 
             sessionType === 'short_break' ? 'Short Break' : 'Long Break'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="text-6xl font-mono font-bold text-gray-800">
              {formatTime(timeLeft)}
            </div>
            
            <Progress 
              value={getProgress()} 
              className="w-full h-3"
            />

            <div className="flex justify-center gap-4">
              {timerState === 'idle' || timerState === 'paused' ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {timerState === 'paused' ? 'Resume' : 'Start'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePause} 
                  size="lg" 
                  variant="outline"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button 
                onClick={handleStop} 
                size="lg" 
                variant="outline"
                disabled={timerState === 'idle'}
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
              
              <Button 
                onClick={handleReset} 
                size="lg" 
                variant="outline"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={sessionType} 
              onValueChange={(value: SessionType) => {
                setSessionType(value);
                if (timerState === 'idle') {
                  const duration = getDurationForSessionType(value, settings);
                  setTimeLeft(duration * 60);
                }
              }}
              disabled={timerState === 'running'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="work">Work ({settings.workDuration}m)</SelectItem>
                <SelectItem value="short_break">Short Break ({settings.shortBreakDuration}m)</SelectItem>
                <SelectItem value="long_break">Long Break ({settings.longBreakDuration}m)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Task</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedTaskId?.toString() || ""} 
              onValueChange={(value) => setSelectedTaskId(value ? parseInt(value) : undefined)}
              disabled={timerState === 'running' || sessionType !== 'work'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No task selected</SelectItem>
                {tasksData?.tasks
                  .filter(task => !task.isCompleted)
                  .map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.title} ({task.completedPomodoros}/{task.estimatedPomodoros})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Completed Work Sessions</p>
              <p className="text-2xl font-bold">{completedWorkSessions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Until Long Break</p>
              <p className="text-2xl font-bold">
                {settings.sessionsUntilLongBreak - (completedWorkSessions % settings.sessionsUntilLongBreak)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
