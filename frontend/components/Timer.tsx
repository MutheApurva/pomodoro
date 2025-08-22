import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, RotateCcw, Target } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Task, UserSettings } from '~backend/pomodoro/types';

type TimerState = 'idle' | 'running' | 'paused';
type SessionType = 'work' | 'short_break' | 'long_break';

interface TimerData {
  timerState: TimerState;
  sessionType: SessionType;
  timeLeft: number;
  selectedTaskId?: number;
  completedWorkSessions: number;
  totalDuration: number;
}

const TIMER_STORAGE_KEY = 'pomodoro-timer-state';

export function Timer() {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed: TimerData = JSON.parse(savedState);
        setTimerState(parsed.timerState);
        setSessionType(parsed.sessionType);
        setTimeLeft(parsed.timeLeft);
        setSelectedTaskId(parsed.selectedTaskId);
        setCompletedWorkSessions(parsed.completedWorkSessions);
        setTotalDuration(parsed.totalDuration);
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  const saveTimerState = useCallback(() => {
    const timerData: TimerData = {
      timerState,
      sessionType,
      timeLeft,
      selectedTaskId,
      completedWorkSessions,
      totalDuration,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
  }, [timerState, sessionType, timeLeft, selectedTaskId, completedWorkSessions, totalDuration]);

  useEffect(() => {
    saveTimerState();
  }, [saveTimerState]);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.pomodoro.getSettings(),
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => backend.pomodoro.listTasks(),
    retry: 3,
    retryDelay: 1000,
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

  // Update timer when settings change (only if idle and no saved state)
  useEffect(() => {
    if (settings && timerState === 'idle' && !localStorage.getItem(TIMER_STORAGE_KEY)) {
      const duration = getDurationForSessionType(sessionType, settings);
      const durationInSeconds = duration * 60;
      setTimeLeft(durationInSeconds);
      setTotalDuration(durationInSeconds);
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

  const handleTimerComplete = async () => {
    setTimerState('idle');
    
    if (!settings) return;

    const duration = getDurationForSessionType(sessionType, settings);
    
    try {
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
          const newDuration = settings.longBreakDuration * 60;
          setTimeLeft(newDuration);
          setTotalDuration(newDuration);
        } else {
          setSessionType('short_break');
          const newDuration = settings.shortBreakDuration * 60;
          setTimeLeft(newDuration);
          setTotalDuration(newDuration);
        }
      } else {
        setSessionType('work');
        const newDuration = settings.workDuration * 60;
        setTimeLeft(newDuration);
        setTotalDuration(newDuration);
      }
    } catch (error) {
      console.error('Error completing session:', error);
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
      const duration = getDurationForSessionType(sessionType, settings) * 60;
      setTimeLeft(duration);
      setTotalDuration(duration);
    }
  };

  const handleReset = () => {
    setTimerState('idle');
    setCompletedWorkSessions(0);
    setSessionType('work');
    if (settings) {
      const duration = settings.workDuration * 60;
      setTimeLeft(duration);
      setTotalDuration(duration);
    }
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handleSessionTypeChange = (value: SessionType) => {
    setSessionType(value);
    if (timerState === 'idle' && settings) {
      const duration = getDurationForSessionType(value, settings) * 60;
      setTimeLeft(duration);
      setTotalDuration(duration);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (totalDuration === 0) return 0;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const getSessionTypeColor = (type: SessionType): string => {
    switch (type) {
      case 'work':
        return 'from-rose-500/80 to-pink-600/80';
      case 'short_break':
        return 'from-emerald-500/80 to-teal-600/80';
      case 'long_break':
        return 'from-cyan-500/80 to-blue-600/80';
      default:
        return 'from-slate-500/80 to-slate-600/80';
    }
  };

  // Show error state if there's an error
  if (settingsError || tasksError) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Error loading data: {settingsError?.message || tasksError?.message}
          </p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['settings'] });
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }}
            className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600/80 hover:to-cyan-600/80 backdrop-blur-sm border border-emerald-400/30"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (settingsLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading timer settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if settings is still null
  if (!settings) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-slate-300 mb-4">Unable to load settings</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['settings'] })}
            className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600/80 hover:to-cyan-600/80 backdrop-blur-sm border border-emerald-400/30"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeTasks = tasksData?.tasks?.filter(task => !task.isCompleted) || [];

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-r ${getSessionTypeColor(sessionType)} backdrop-blur-sm p-6 border-b border-white/10`}>
          <h2 className="text-center text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Target className="w-6 h-6" />
            {sessionType === 'work' ? 'Focus Session' : 
             sessionType === 'short_break' ? 'Quick Break' : 'Long Break'}
          </h2>
        </div>
        <div className="p-8">
          <div className="text-center space-y-8">
            <div className="text-7xl font-mono font-bold text-white drop-shadow-lg tracking-wider">
              {formatTime(timeLeft)}
            </div>
            
            <div className="relative">
              <Progress 
                value={getProgress()} 
                className="w-full h-4 bg-white/10 backdrop-blur-sm rounded-full overflow-hidden"
              />
            </div>

            <div className="flex justify-center gap-3">
              {timerState === 'idle' || timerState === 'paused' ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-500/80 to-teal-600/80 hover:from-emerald-600/80 hover:to-teal-700/80 backdrop-blur-sm border border-emerald-400/30 text-white shadow-lg px-8 py-3 text-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {timerState === 'paused' ? 'Resume' : 'Start'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePause} 
                  size="lg" 
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white shadow-lg px-8 py-3 text-lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button 
                onClick={handleStop} 
                size="lg" 
                disabled={timerState === 'idle'}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white shadow-lg disabled:opacity-50 px-6 py-3"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
              
              <Button 
                onClick={handleReset} 
                size="lg" 
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white shadow-lg px-6 py-3"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Session Type</h3>
          <Select 
            value={sessionType} 
            onValueChange={handleSessionTypeChange}
            disabled={timerState === 'running'}
          >
            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
              <SelectItem value="work" className="text-white hover:text-slate-900">Focus Session ({settings.workDuration}m)</SelectItem>
              <SelectItem value="short_break" className="text-white hover:text-slate-900">Quick Break ({settings.shortBreakDuration}m)</SelectItem>
              <SelectItem value="long_break" className="text-white hover:text-slate-900">Long Break ({settings.longBreakDuration}m)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Current Task</h3>
          <Select 
            value={selectedTaskId?.toString() || "none"} 
            onValueChange={(value) => setSelectedTaskId(value === "none" ? undefined : parseInt(value))}
            disabled={timerState === 'running' || sessionType !== 'work'}
          >
            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <SelectValue placeholder="Select a task (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800/95 backdrop-blur-xl border-white/20">
              <SelectItem value="none" className="text-white hover:text-slate-900">No task selected</SelectItem>
              {activeTasks.map((task) => (
                <SelectItem key={task.id} value={task.id.toString()} className="text-white hover:text-slate-900">
                  {task.title} ({task.completedPomodoros}/{task.estimatedPomodoros})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Tasks Quick View */}
      {activeTasks.length > 0 && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Active Tasks</h3>
          <div className="space-y-3">
            {activeTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-1">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <p className="text-sm text-slate-300">
                    {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
                  </p>
                </div>
                <div className="w-20">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                      style={{
                        width: `${Math.min((task.completedPomodoros / task.estimatedPomodoros) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {activeTasks.length > 3 && (
              <p className="text-sm text-slate-400 text-center">
                +{activeTasks.length - 3} more tasks
              </p>
            )}
          </div>
        </div>
      )}

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Completed Sessions</p>
            <p className="text-3xl font-bold text-emerald-400">{completedWorkSessions}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Until Long Break</p>
            <p className="text-3xl font-bold text-cyan-400">
              {settings.sessionsUntilLongBreak - (completedWorkSessions % settings.sessionsUntilLongBreak)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
