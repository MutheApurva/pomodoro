import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Target, TrendingUp, Calendar, Flame, BarChart3 } from 'lucide-react';
import backend from '~backend/client';

export function Statistics() {
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => backend.pomodoro.getStatistics(),
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-4"></div>
            <p className="text-slate-300">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading statistics: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <p className="text-slate-400">No statistics available.</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Sessions',
      value: statistics.totalSessions,
      icon: Clock,
      color: 'from-cyan-400/80 to-blue-600/80',
      description: 'All completed sessions',
    },
    {
      title: 'Focus Sessions',
      value: statistics.totalWorkSessions,
      icon: Target,
      color: 'from-rose-400/80 to-pink-600/80',
      description: 'Productive work periods',
    },
    {
      title: 'Break Sessions',
      value: statistics.totalBreakSessions,
      icon: CheckCircle,
      color: 'from-emerald-400/80 to-teal-600/80',
      description: 'Rest and recharge time',
    },
    {
      title: 'Total Minutes',
      value: statistics.totalMinutes,
      icon: Clock,
      color: 'from-violet-400/80 to-purple-600/80',
      description: 'Time spent in sessions',
    },
    {
      title: 'Completed Tasks',
      value: statistics.completedTasks,
      icon: CheckCircle,
      color: 'from-emerald-400/80 to-emerald-600/80',
      description: 'Tasks finished',
    },
    {
      title: 'Daily Average',
      value: statistics.averageSessionsPerDay,
      icon: TrendingUp,
      color: 'from-orange-400/80 to-orange-600/80',
      description: 'Sessions per day (30d avg)',
    },
    {
      title: 'Current Streak',
      value: statistics.streakDays,
      icon: Flame,
      color: 'from-yellow-400/80 to-amber-600/80',
      description: 'Consecutive active days',
    },
  ];

  const formatValue = (value: number, title: string): string => {
    if (title === 'Total Minutes') {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }
    if (title === 'Daily Average') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2 mb-2">
          <BarChart3 className="w-8 h-8" />
          Productivity Analytics
        </h2>
        <p className="text-slate-400 font-medium">Track your progress and stay motivated</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all hover:bg-white/10 group">
            <div className={`bg-gradient-to-r ${stat.color} backdrop-blur-sm p-4 border-b border-white/10`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{stat.title}</h3>
                <stat.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-white mb-2">
                {formatValue(stat.value, stat.title)}
              </div>
              <p className="text-sm text-slate-400">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Productivity Insights
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Work/Break Ratio</span>
              <span className="font-semibold text-white">
                {statistics.totalBreakSessions > 0 
                  ? (statistics.totalWorkSessions / statistics.totalBreakSessions).toFixed(1)
                  : statistics.totalWorkSessions
                }:1
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Average Session Length</span>
              <span className="font-semibold text-white">
                {statistics.totalSessions > 0 
                  ? Math.round(statistics.totalMinutes / statistics.totalSessions)
                  : 0
                } min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Focus Efficiency</span>
              <span className="font-semibold text-emerald-400">
                {statistics.totalSessions > 0 
                  ? Math.round((statistics.totalWorkSessions / statistics.totalSessions) * 100)
                  : 0
                }%
              </span>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Achievement Badges
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {statistics.totalSessions >= 10 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs font-semibold text-white">Getting Started</div>
              </div>
            )}
            {statistics.totalSessions >= 50 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">🚀</div>
                <div className="text-xs font-semibold text-white">Momentum Builder</div>
              </div>
            )}
            {statistics.totalSessions >= 100 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-xs font-semibold text-white">Focus Master</div>
              </div>
            )}
            {statistics.streakDays >= 7 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs font-semibold text-white">Week Warrior</div>
              </div>
            )}
            {statistics.completedTasks >= 10 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">✅</div>
                <div className="text-xs font-semibold text-white">Task Crusher</div>
              </div>
            )}
            {statistics.totalMinutes >= 1000 && (
              <div className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">⏰</div>
                <div className="text-xs font-semibold text-white">Time Keeper</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
