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

interface TimerData {
  timerState: TimerState;
  sessionType: SessionType;
  timeLeft: number;
  selectedTaskId?: number;
  completedWorkSessions: number;
  startTime?: number;
}

const TIMER_STORAGE_KEY = 'pomodoro-timer-state';

export function Timer() {
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>();
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const [startTime, setStartTime] = useState<number | undefined>();
  
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
        setSelectedTaskId(parsed.selectedTaskId);
        setCompletedWorkSessions(parsed.completedWorkSessions);
        
        // Calculate current time left if timer was running
        if (parsed.timerState === 'running' && parsed.startTime) {
          const elapsed = Math.floor((Date.now() - parsed.startTime) / 1000);
          const newTimeLeft = Math.max(0, parsed.timeLeft - elapsed);
          setTimeLeft(newTimeLeft);
          setStartTime(parsed.startTime);
          
          if (newTimeLeft === 0) {
            setTimerState('idle');
          }
        } else {
          setTimeLeft(parsed.timeLeft);
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    }
  }, []);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    const timerData: TimerData = {
      timerState,
      sessionType,
      timeLeft,
      selectedTaskId,
      completedWorkSessions,
      startTime,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerData));
  }, [timerState, sessionType, timeLeft, selectedTaskId, completedWorkSessions, startTime]);

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

  // Update timer when settings change (only if idle)
  useEffect(() => {
    if (settings && timerState === 'idle' && !localStorage.getItem(TIMER_STORAGE_KEY)) {
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

  const handleTimerComplete = async () => {
    setTimerState('idle');
    setStartTime(undefined);
    
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
          setTimeLeft(settings.longBreakDuration * 60);
        } else {
          setSessionType('short_break');
          setTimeLeft(settings.shortBreakDuration * 60);
        }
      } else {
        setSessionType('work');
        setTimeLeft(settings.workDuration * 60);
      }
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleStart = () => {
    setTimerState('running');
    setStartTime(Date.now());
  };

  const handlePause = () => {
    setTimerState('paused');
    setStartTime(undefined);
  };

  const handleStop = () => {
    setTimerState('idle');
    setStartTime(undefined);
    if (settings) {
      const duration = getDurationForSessionType(sessionType, settings);
      setTimeLeft(duration * 60);
    }
  };

  const handleReset = () => {
    setTimerState('idle');
    setCompletedWorkSessions(0);
    setSessionType('work');
    setStartTime(undefined);
    if (settings) {
      setTimeLeft(settings.workDuration * 60);
    }
    localStorage.removeItem(TIMER_STORAGE_KEY);
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
        return 'from-red-400/80 to-red-600/80';
      case 'short_break':
        return 'from-green-400/80 to-green-600/80';
      case 'long_break':
        return 'from-blue-400/80 to-blue-600/80';
      default:
        return 'from-gray-400/80 to-gray-600/80';
    }
  };

  // Show error state if there's an error
  if (settingsError || tasksError) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Error loading data: {settingsError?.message || tasksError?.message}
          </p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['settings'] });
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }}
            className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 backdrop-blur-sm border border-white/20"
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
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white/80">Loading timer settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback if settings is still null
  if (!settings) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-white/80 mb-4">Unable to load settings</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['settings'] })}
            className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 hover:from-purple-600/80 hover:to-blue-600/80 backdrop-blur-sm border border-white/20"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden shadow-2xl">
        <div className={`bg-gradient-to-r ${getSessionTypeColor(sessionType)} backdrop-blur-sm p-6`}>
          <h2 className="text-center text-2xl font-bold text-white">
            {sessionType === 'work' ? 'Work Session' : 
             sessionType === 'short_break' ? 'Short Break' : 'Long Break'}
          </h2>
        </div>
        <div className="p-8">
          <div className="text-center space-y-6">
            <div className="text-6xl font-mono font-bold text-white drop-shadow-lg">
              {formatTime(timeLeft)}
            </div>
            
            <div className="relative">
              <Progress 
                value={getProgress()} 
                className="w-full h-3 bg-white/20 backdrop-blur-sm"
              />
            </div>

            <div className="flex justify-center gap-4">
              {timerState === 'idle' || timerState === 'paused' ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500/80 to-green-600/80 hover:from-green-600/80 hover:to-green-700/80 backdrop-blur-sm border border-white/20 text-white shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  {timerState === 'paused' ? 'Resume' : 'Start'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePause} 
                  size="lg" 
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-lg"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button 
                onClick={handleStop} 
                size="lg" 
                disabled={timerState === 'idle'}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-lg disabled:opacity-50"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop
              </Button>
              
              <Button 
                onClick={handleReset} 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white shadow-lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Session Type</h3>
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
            <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-xl border-white/30">
              <SelectItem value="work">Work ({settings.workDuration}m)</SelectItem>
              <SelectItem value="short_break">Short Break ({settings.shortBreakDuration}m)</SelectItem>
              <SelectItem value="long_break">Long Break ({settings.longBreakDuration}m)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Current Task</h3>
          <Select 
            value={selectedTaskId?.toString() || "none"} 
            onValueChange={(value) => setSelectedTaskId(value === "none" ? undefined : parseInt(value))}
            disabled={timerState === 'running' || sessionType !== 'work'}
          >
            <SelectTrigger className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
              <SelectValue placeholder="Select a task (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-white/90 backdrop-blur-xl border-white/30">
              <SelectItem value="none">No task selected</SelectItem>
              {tasksData?.tasks
                ?.filter(task => !task.isCompleted)
                ?.map((task) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.title} ({task.completedPomodoros}/{task.estimatedPomodoros})
                  </SelectItem>
                )) || []}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-white/70">Completed Work Sessions</p>
            <p className="text-2xl font-bold text-white">{completedWorkSessions}</p>
          </div>
          <div>
            <p className="text-sm text-white/70">Until Long Break</p>
            <p className="text-2xl font-bold text-white">
              {settings.sessionsUntilLongBreak - (completedWorkSessions % settings.sessionsUntilLongBreak)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
