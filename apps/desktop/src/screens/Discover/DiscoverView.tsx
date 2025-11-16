import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, TrendingUp, Radio, Users, Heart, Filter, X
} from 'lucide-react';
import { Card, Input, Button } from '@voicecast/ui';

interface Stream {
  id: string;
  title: string;
  broadcaster: {
    username: string;
    avatar?: string;
  };
  category: string;
  viewers: number;
  likes: number;
  isLive: boolean;
  tags: string[];
}

const categories = [
  'All',
  'Music',
  'Talk Show',
  'Podcast',
  'ASMR',
  'Gaming',
  'Education',
  'Comedy',
];

const mockStreams: Stream[] = [
  {
    id: '1',
    title: 'Late Night Jazz Session 🎷',
    broadcaster: { username: 'JazzMaster' },
    category: 'Music',
    viewers: 1234,
    likes: 456,
    isLive: true,
    tags: ['jazz', 'chill', 'instrumental'],
  },
  {
    id: '2',
    title: 'Morning Coffee & Deep Conversations ☕',
    broadcaster: { username: 'CoffeeTalk' },
    category: 'Talk Show',
    viewers: 892,
    likes: 234,
    isLive: true,
    tags: ['talk', 'morning', 'lifestyle'],
  },
  {
    id: '3',
    title: 'Tech News & Discussion',
    broadcaster: { username: 'TechGuru' },
    category: 'Podcast',
    viewers: 567,
    likes: 189,
    isLive: true,
    tags: ['tech', 'news', 'discussion'],
  },
  {
    id: '4',
    title: 'Relaxing ASMR Sounds 🌙',
    broadcaster: { username: 'ASMRWhispers' },
    category: 'ASMR',
    viewers: 2341,
    likes: 987,
    isLive: true,
    tags: ['asmr', 'relaxing', 'sleep'],
  },
  {
    id: '5',
    title: 'Live Coding Session - Building a Web App',
    broadcaster: { username: 'CodeMaster' },
    category: 'Education',
    viewers: 445,
    likes: 123,
    isLive: true,
    tags: ['coding', 'education', 'web'],
  },
  {
    id: '6',
    title: 'Stand-up Comedy Night 😂',
    broadcaster: { username: 'FunnyGuy' },
    category: 'Comedy',
    viewers: 678,
    likes: 345,
    isLive: true,
    tags: ['comedy', 'standup', 'entertainment'],
  },
];

export const DiscoverView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'viewers' | 'recent'>('viewers');
  const [showFilters, setShowFilters] = useState(false);

  const filteredStreams = mockStreams
    .filter((stream) => {
      const matchesSearch =
        stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.broadcaster.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stream.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'All' || stream.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'viewers') {
        return b.viewers - a.viewers;
      }
      return 0; // For 'recent', would use timestamp
    });

  const StreamCard = ({ stream, index }: { stream: Stream; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card hoverable variant="default" className="overflow-hidden">
        {/* Thumbnail Placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 mb-4 -mx-6 -mt-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="w-16 h-16 text-white/40" />
          </div>
          {stream.isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 bg-semantic-live rounded-full text-white text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" />
              LIVE
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm">
            <Users className="w-4 h-4" />
            {stream.viewers.toLocaleString()}
          </div>
        </div>

        {/* Stream Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-sm font-bold flex-shrink-0">
              {stream.broadcaster.username[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary line-clamp-2 mb-1">
                {stream.title}
              </h3>
              <p className="text-sm text-text-tertiary">{stream.broadcaster.username}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="px-3 py-1 bg-bg-tertiary rounded-full text-xs font-medium">
              {stream.category}
            </div>
            <div className="flex items-center gap-1 text-text-tertiary">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{stream.likes}</span>
            </div>
          </div>

          {stream.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stream.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-surface-tertiary rounded text-xs text-text-tertiary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Discover Streams</h1>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search streams, broadcasters, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
                rightIcon={
                  searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-5 h-5" />
                    </button>
                  )
                }
                inputSize="lg"
              />
            </div>
            <Button
              variant="secondary"
              size="lg"
              icon={<Filter />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-primary text-text-tertiary hover:bg-surface-secondary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-text-tertiary" />
            <span className="text-text-secondary">
              {filteredStreams.length} live streams
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('viewers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'viewers'
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-primary text-text-tertiary hover:bg-surface-secondary'
              }`}
            >
              Most Viewers
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-brand-primary text-white'
                  : 'bg-surface-primary text-text-tertiary hover:bg-surface-secondary'
              }`}
            >
              Recently Started
            </button>
          </div>
        </div>

        {/* Streams Grid */}
        {filteredStreams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream, index) => (
              <StreamCard key={stream.id} stream={stream} index={index} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Search className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No streams found</h3>
            <p className="text-text-tertiary">
              Try adjusting your search or filters
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};
