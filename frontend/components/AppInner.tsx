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
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
          Pomodoro Focus
        </h1>
        <p className="text-white/80 text-lg">Stay focused and productive with the Pomodoro Technique</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-2 mb-8 shadow-2xl">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
            <TabsTrigger 
              value="timer" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-blue-500/80 backdrop-blur-sm border border-white/20 text-white data-[state=active]:text-white rounded-2xl transition-all"
            >
              <Clock className="w-4 h-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-blue-500/80 backdrop-blur-sm border border-white/20 text-white data-[state=active]:text-white rounded-2xl transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-blue-500/80 backdrop-blur-sm border border-white/20 text-white data-[state=active]:text-white rounded-2xl transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/80 data-[state=active]:to-blue-500/80 backdrop-blur-sm border border-white/20 text-white data-[state=active]:text-white rounded-2xl transition-all"
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

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
