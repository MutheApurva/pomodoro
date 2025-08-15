import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Clock, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { UserSettings } from '~backend/pomodoro/types';

export function Settings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: fetchedSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => backend.pomodoro.getSettings(),
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
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Pomodoro Settings</h2>
        <p className="text-gray-600">Customize your work and break intervals</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Timer Durations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="work-duration">Work Session (minutes)</Label>
              <Input
                id="work-duration"
                type="number"
                min="1"
                max="60"
                value={settings.workDuration}
                onChange={(e) => handleSettingChange('workDuration', parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-gray-500">
                Recommended: 25 minutes for optimal focus
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-break-duration">Short Break (minutes)</Label>
              <Input
                id="short-break-duration"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => handleSettingChange('shortBreakDuration', parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-gray-500">
                Quick rest between work sessions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="long-break-duration">Long Break (minutes)</Label>
              <Input
                id="long-break-duration"
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => handleSettingChange('longBreakDuration', parseInt(e.target.value) || 1)}
              />
              <p className="text-sm text-gray-500">
                Extended rest after multiple work sessions
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessions-until-long-break">Sessions Until Long Break</Label>
              <Input
                id="sessions-until-long-break"
                type="number"
                min="2"
                max="10"
                value={settings.sessionsUntilLongBreak}
                onChange={(e) => handleSettingChange('sessionsUntilLongBreak', parseInt(e.target.value) || 2)}
              />
              <p className="text-sm text-gray-500">
                Number of work sessions before a long break
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateSettingsMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {settings.workDuration}m
              </div>
              <div className="text-sm text-red-700">Work Session</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {settings.shortBreakDuration}m
              </div>
              <div className="text-sm text-green-700">Short Break</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {settings.longBreakDuration}m
              </div>
              <div className="text-sm text-blue-700">Long Break</div>
            </div>
          </div>
          <div className="text-center mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Long break after every <strong>{settings.sessionsUntilLongBreak}</strong> work sessions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
