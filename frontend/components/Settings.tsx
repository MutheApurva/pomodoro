import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, Save, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { UserSettings } from '~backend/pomodoro/types';

export function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: fetchedSettings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.pomodoro.getSettings(),
    retry: 3,
    retryDelay: 1000,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: {
      workDuration?: number;
      shortBreakDuration?: number;
      longBreakDuration?: number;
      sessionsUntilLongBreak?: number;
    }) => backend.pomodoro.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setHasChanges(false);
      toast({
        title: 'Success',
        description: 'Settings updated successfully!',
      });
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Initialize local settings when fetched settings change
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setHasChanges(false);
    }
  }, [fetchedSettings]);

  const handleSettingChange = (field: keyof UserSettings, value: number) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [field]: value,
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!settings || !fetchedSettings) return;

    const changes: any = {};
    
    if (settings.workDuration !== fetchedSettings.workDuration) {
      changes.workDuration = settings.workDuration;
    }
    if (settings.shortBreakDuration !== fetchedSettings.shortBreakDuration) {
      changes.shortBreakDuration = settings.shortBreakDuration;
    }
    if (settings.longBreakDuration !== fetchedSettings.longBreakDuration) {
      changes.longBreakDuration = settings.longBreakDuration;
    }
    if (settings.sessionsUntilLongBreak !== fetchedSettings.sessionsUntilLongBreak) {
      changes.sessionsUntilLongBreak = settings.sessionsUntilLongBreak;
    }

    updateSettingsMutation.mutate(changes);
  };

  const handleReset = () => {
    if (!fetchedSettings) return;
    setSettings(fetchedSettings);
    setHasChanges(false);
  };

  const resetToDefaults = () => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
    });
    setHasChanges(true);
  };

  if (isLoading || !settings) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading settings: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 mb-2">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h2>
        <p className="text-slate-400 font-medium">Customize your work and break intervals</p>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timer Durations
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="work-duration" className="text-white">Focus Session (minutes)</Label>
              <Input
                id="work-duration"
                type="number"
                min="1"
                max="60"
                value={settings.workDuration}
                onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value) || 1)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400">
                Recommended: 25 minutes for optimal focus
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-break-duration" className="text-white">Quick Break (minutes)</Label>
              <Input
                id="short-break-duration"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 1)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400">
                Quick rest between work sessions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-break-duration" className="text-white">Long Break (minutes)</Label>
              <Input
                id="long-break-duration"
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 1)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400">
                Extended rest after multiple work sessions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions-until-long-break" className="text-white">Sessions Until Long Break</Label>
              <Input
                id="sessions-until-long-break"
                type="number"
                min="2"
                max="10"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => handleSettingChange('sessionsUntilLongBreak', parseInt(e.target.value) || 2)}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-slate-400"
              />
              <p className="text-sm text-slate-400">
                Number of work sessions before a long break
              </p>
            </div>
          </div>

          <Separator className="bg-white/20" />

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateSettingsMutation.isPending}
                className="bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 hover:from-emerald-600/80 hover:to-cyan-600/80 backdrop-blur-sm border border-emerald-400/30 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-rose-400/20 to-pink-600/20 rounded-xl border border-rose-400/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-rose-300 mb-1">
              {settings.workDuration}m
            </div>
            <div className="text-sm text-rose-200">Focus Session</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-xl border border-emerald-400/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-emerald-300 mb-1">
              {settings.shortBreakDuration}m
            </div>
            <div className="text-sm text-emerald-200">Quick Break</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
            <div className="text-2xl font-bold text-cyan-300 mb-1">
              {settings.longBreakDuration}m
            </div>
            <div className="text-sm text-cyan-200">Long Break</div>
          </div>
        </div>
        <div className="text-center mt-4 p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <p className="text-sm text-slate-400">
            Long break after every <strong className="text-white">{settings.sessionsUntilLongBreak}</strong> work sessions
          </p>
        </div>
      </div>
    </div>
  );
}
