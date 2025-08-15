import React, { useState } from 'react';
import { Timer } from './Timer';
import { TaskList } from './TaskList';
import { Statistics } from './Statistics';
import { Settings } from './Settings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckSquare, BarChart3, Settings as SettingsIcon } from 'lucide-react';

export function AppInner() {
  const [activeTab, setActiveTab] = useState('timer');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Pomodoro Focus
        </h1>
        <p className="text-gray-600">Stay focused and productive with the Pomodoro Technique</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="space-y-6">
          <Timer />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskList />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <Statistics />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Settings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
