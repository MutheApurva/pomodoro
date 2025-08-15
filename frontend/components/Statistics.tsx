import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle, Target, TrendingUp, Calendar, Flame } from 'lucide-react';
import backend from '~backend/client';

export function Statistics() {
  const { data: statistics, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => backend.pomodoro.getStatistics(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No statistics available.</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Sessions',
      value: statistics.totalSessions,
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      description: 'All completed sessions',
    },
    {
      title: 'Work Sessions',
      value: statistics.totalWorkSessions,
      icon: Target,
      color: 'from-red-500 to-red-600',
      description: 'Focused work periods',
    },
    {
      title: 'Break Sessions',
      value: statistics.totalBreakSessions,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      description: 'Rest and recharge time',
    },
    {
      title: 'Total Minutes',
      value: statistics.totalMinutes,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      description: 'Time spent in sessions',
    },
    {
      title: 'Completed Tasks',
      value: statistics.completedTasks,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      description: 'Tasks finished',
    },
    {
      title: 'Daily Average',
      value: statistics.averageSessionsPerDay,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      description: 'Sessions per day (30d avg)',
    },
    {
      title: 'Current Streak',
      value: statistics.streakDays,
      icon: Flame,
      color: 'from-yellow-500 to-yellow-600',
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
        <h2 className="text-2xl font-bold mb-2">Your Productivity Statistics</h2>
        <p className="text-gray-600">Track your progress and stay motivated</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
            <CardHeader className={`bg-gradient-to-r ${stat.color} text-white pb-3`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">{stat.title}</CardTitle>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-800 mb-2">
                {formatValue(stat.value, stat.title)}
              </div>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Work/Break Ratio</span>
              <span className="font-semibold">
                {statistics.totalBreakSessions > 0 
                  ? (statistics.totalWorkSessions / statistics.totalBreakSessions).toFixed(1)
                  : statistics.totalWorkSessions
                }:1
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Session Length</span>
              <span className="font-semibold">
                {statistics.totalSessions > 0 
                  ? Math.round(statistics.totalMinutes / statistics.totalSessions)
                  : 0
                } min
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Focus Efficiency</span>
              <span className="font-semibold">
                {statistics.totalSessions > 0 
                  ? Math.round((statistics.totalWorkSessions / statistics.totalSessions) * 100)
                  : 0
                }%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Achievement Badges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {statistics.totalSessions >= 10 && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs font-semibold">Getting Started</div>
                </div>
              )}
              {statistics.totalSessions >= 50 && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-1">🚀</div>
                  <div className="text-xs font-semibold">Momentum Builder</div>
                </div>
              )}
              {statistics.totalSessions >= 100 && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-xs font-semibold">Focus Master</div>
                </div>
              )}
              {statistics.streakDays >= 7 && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl mb-1">🔥</div>
                  <div className="text-xs font-semibold">Week Warrior</div>
                </div>
              )}
              {statistics.completedTasks >= 10 && (
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-2xl mb-1">✅</div>
                  <div className="text-xs font-semibold">Task Crusher</div>
                </div>
              )}
              {statistics.totalMinutes >= 1000 && (
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl mb-1">⏰</div>
                  <div className="text-xs font-semibold">Time Keeper</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
