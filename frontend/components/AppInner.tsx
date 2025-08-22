import React, { useState } from 'react';
import { Timer } from './Timer';
import { TaskList } from './TaskList';
import { Statistics } from './Statistics';
import { Settings } from './Settings';
import { Notes } from './Notes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckSquare, BarChart3, Settings as SettingsIcon, FileText } from 'lucide-react';

export function AppInner() {
  const [activeTab, setActiveTab] = useState('timer');

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent mb-4 drop-shadow-lg">
          Focus Flow
        </h1>
        <p className="text-slate-300 text-lg font-medium">Master your productivity with the Pomodoro Technique</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-1 mb-8 shadow-2xl">
          <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
            <TabsTrigger 
              value="timer" 
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              <Clock className="w-4 h-4" />
              Timer
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              <CheckSquare className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger 
              value="statistics" 
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 bg-transparent hover:bg-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-emerald-400/30 backdrop-blur-sm text-slate-300 data-[state=active]:text-white rounded-xl transition-all duration-200"
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

        <TabsContent value="notes" className="space-y-6">
          <Notes />
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
