import React from 'react';
import {
  Users, Radio, DollarSign, TrendingUp,
  AlertTriangle, Clock, Gift, MessageCircle
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { RealtimeChart } from '@/components/RealtimeChart';
import { ActivityFeed } from '@/components/ActivityFeed';
import { TopStreamers } from '@/components/TopStreamers';

export default async function DashboardPage() {
  // Fetch real-time stats
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.userGrowth}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Live Streams"
          value={stats.liveStreams}
          change={stats.streamGrowth}
          icon={Radio}
          color="green"
          realtime
        />
        <StatsCard
          title="Revenue (24h)"
          value={`$${stats.dailyRevenue}`}
          change={stats.revenueGrowth}
          icon={DollarSign}
          color="purple"
        />
        <StatsCard
          title="Active Now"
          value={stats.activeUsers}
          change={stats.activeGrowth}
          icon={TrendingUp}
          color="orange"
          realtime
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">User Activity</h2>
          <RealtimeChart
            endpoint="/api/analytics/user-activity"
            type="area"
            color="#6366F1"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Stream Performance</h2>
          <RealtimeChart
            endpoint="/api/analytics/stream-performance"
            type="line"
            color="#10B981"
          />
        </div>
      </div>

      {/* Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopStreamers />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
