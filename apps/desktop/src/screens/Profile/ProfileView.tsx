import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Radio, Users, Heart, Clock, TrendingUp,
  Calendar, Award, Star, Crown, Edit
} from 'lucide-react';
import { Button, Card } from '@voicecast/ui';

export const ProfileView: React.FC = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'streams' | 'about' | 'stats'>('streams');

  // Mock profile data
  const profile = {
    userId: 'user123',
    username: 'JazzMaster',
    displayName: 'The Jazz Master',
    avatar: undefined,
    bio: 'Professional jazz musician streaming late-night sessions. Playing since 2015. Love requests!',
    joinedDate: new Date('2023-01-15'),
    stats: {
      followers: 12450,
      totalViews: 458920,
      totalStreams: 156,
      totalHours: 342,
      averageViewers: 234,
      peakViewers: 1840,
    },
    badges: [
      { id: 'verified', name: 'Verified', icon: <Award className="w-4 h-4" />, color: '#3B82F6' },
      { id: 'partner', name: 'Partner', icon: <Crown className="w-4 h-4" />, color: '#8B5CF6' },
      { id: 'top-streamer', name: 'Top Streamer', icon: <Star className="w-4 h-4" />, color: '#F59E0B' },
    ],
    recentStreams: [
      {
        id: '1',
        title: 'Late Night Jazz Session 🎷',
        category: 'Music',
        viewers: 456,
        duration: '2h 15m',
        date: new Date('2024-11-15'),
      },
      {
        id: '2',
        title: 'Smooth Jazz & Chill Vibes',
        category: 'Music',
        viewers: 389,
        duration: '1h 45m',
        date: new Date('2024-11-14'),
      },
      {
        id: '3',
        title: 'Jazz Standards Requests',
        category: 'Music',
        viewers: 512,
        duration: '3h 00m',
        date: new Date('2024-11-13'),
      },
    ],
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-primary rounded-2xl p-8 border border-border-subtle mb-6"
        >
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-5xl font-bold">
                {profile.username[0]}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center border-4 border-surface-primary">
                <Radio className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                    <div className="flex gap-2">
                      {profile.badges.map((badge) => (
                        <div
                          key={badge.id}
                          className="px-2 py-1 rounded-lg flex items-center gap-1"
                          style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                          title={badge.name}
                        >
                          {badge.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-text-tertiary mb-1">@{profile.username}</p>
                  <p className="text-text-secondary">{profile.bio}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? 'secondary' : 'primary'}
                    size="md"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="ghost" size="md" icon={<Settings />} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-6 pt-4 border-t border-border-subtle">
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Followers</p>
                  <p className="text-2xl font-bold">{profile.stats.followers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Total Views</p>
                  <p className="text-2xl font-bold">{profile.stats.totalViews.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Streams</p>
                  <p className="text-2xl font-bold">{profile.stats.totalStreams}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm mb-1">Hours Streamed</p>
                  <p className="text-2xl font-bold">{profile.stats.totalHours}h</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['streams', 'about', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-primary text-text-tertiary hover:bg-surface-secondary'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'streams' && (
            <div className="grid gap-4">
              {profile.recentStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="default" hoverable className="cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{stream.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {stream.date.toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {stream.viewers} viewers
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {stream.duration}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-bg-tertiary rounded-lg text-sm font-medium">
                        {stream.category}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-text-secondary leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Member Since</h3>
                    <p className="text-text-secondary">{formatDate(profile.joinedDate)}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-6"
            >
              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-text-tertiary">Average Viewers</span>
                    <span className="font-semibold">{profile.stats.averageViewers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-tertiary">Peak Viewers</span>
                    <span className="font-semibold">{profile.stats.peakViewers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-tertiary">Total Hours</span>
                    <span className="font-semibold">{profile.stats.totalHours}h</span>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Achievements
                </h3>
                <div className="space-y-3">
                  {profile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: `${badge.color}10` }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                      >
                        {badge.icon}
                      </div>
                      <span className="font-medium">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
