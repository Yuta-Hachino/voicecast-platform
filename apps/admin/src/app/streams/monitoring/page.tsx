import React from 'react';
import { StreamGrid } from '@/components/StreamGrid';
import { StreamFilters } from '@/components/StreamFilters';
import { ModerationQueue } from '@/components/ModerationQueue';

export default function StreamMonitoringPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Live Stream Monitoring</h1>

      <StreamFilters />

      {/* Live Stream Grid */}
      <StreamGrid />

      {/* Moderation Queue */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Moderation Queue</h2>
        <ModerationQueue />
      </div>
    </div>
  );
}
