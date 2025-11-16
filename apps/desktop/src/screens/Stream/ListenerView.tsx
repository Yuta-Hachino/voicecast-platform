import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Users, Radio, Share2, MoreVertical,
  Volume2, VolumeX, Gift as GiftIcon, MessageCircle
} from 'lucide-react';
import { Button, Waveform, Chat, GiftAnimation, GiftSelector, Modal } from '@voicecast/ui';
import type { ChatMessage } from '@voicecast/ui';

export const ListenerView: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [hasLiked, setHasLiked] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [viewerCount, setViewerCount] = useState(1234);
  const [likeCount, setLikeCount] = useState(5678);

  // Mock chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'user1',
      username: 'Alice',
      message: 'Great stream!',
      timestamp: new Date(),
      type: 'message',
    },
    {
      id: '2',
      userId: 'user2',
      username: 'Bob',
      message: 'Loving the music!',
      timestamp: new Date(),
      type: 'message',
    },
  ]);

  // Stream info
  const streamInfo = {
    title: 'Late Night Jazz Session 🎷',
    category: 'Music',
    broadcasterName: 'JazzMaster',
    broadcasterAvatar: undefined,
    startedAt: new Date(Date.now() - 3600000), // 1 hour ago
  };

  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      username: 'You',
      message,
      timestamp: new Date(),
      type: 'message',
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleLike = () => {
    setHasLiked(!hasLiked);
    setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: streamInfo.title,
          text: `Listen to ${streamInfo.broadcasterName} on VoiceCast!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  const getStreamDuration = () => {
    const diff = Date.now() - streamInfo.startedAt.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      {/* Header */}
      <motion.header
        className="border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                <Radio className="w-8 h-8 text-brand-primary" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-semantic-live rounded-full animate-pulse" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {streamInfo.title}
                </h1>
                <p className="text-sm text-text-tertiary">
                  {streamInfo.broadcasterName} • {streamInfo.category}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-text-tertiary" />
                <span className="text-lg font-semibold">{viewerCount.toLocaleString()}</span>
              </div>
              <Button variant="ghost" size="sm" icon={<MoreVertical />} />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Player Card */}
            <motion.div
              className="bg-surface-primary rounded-2xl p-8 border border-border-subtle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {/* Broadcaster Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-2xl font-bold">
                  {streamInfo.broadcasterName[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{streamInfo.broadcasterName}</h2>
                  <p className="text-text-tertiary">
                    Live for {getStreamDuration()}
                  </p>
                </div>
                <Button variant="primary" size="md">
                  Follow
                </Button>
              </div>

              {/* Audio Visualizer */}
              <div className="bg-bg-secondary rounded-xl p-6 mb-6">
                <Waveform color="#6366F1" height={200} bars={64} />
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Volume Control */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="md"
                    icon={isMuted ? <VolumeX /> : <Volume2 />}
                    onClick={() => setIsMuted(!isMuted)}
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseInt(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-full h-2 bg-bg-tertiary rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #6366F1 0%, #6366F1 ${volume}%, #353542 ${volume}%, #353542 100%)`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-text-tertiary w-12 text-right">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant={hasLiked ? 'danger' : 'secondary'}
                    size="lg"
                    onClick={handleLike}
                    icon={<Heart className={hasLiked ? 'fill-current' : ''} />}
                    className="flex-1"
                  >
                    {likeCount.toLocaleString()}
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setShowGiftModal(true)}
                    icon={<GiftIcon />}
                    className="flex-1"
                  >
                    Send Gift
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleShare}
                    icon={<Share2 />}
                  >
                    Share
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stream Description */}
            <motion.div
              className="bg-surface-primary rounded-2xl p-6 border border-border-subtle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-semibold mb-3">About this stream</h3>
              <p className="text-text-secondary leading-relaxed">
                Welcome to my late-night jazz session! Playing smooth jazz classics
                and modern interpretations. Feel free to request songs in the chat!
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-bg-tertiary rounded-full text-sm text-text-tertiary">
                  #jazz
                </span>
                <span className="px-3 py-1 bg-bg-tertiary rounded-full text-sm text-text-tertiary">
                  #livemusic
                </span>
                <span className="px-3 py-1 bg-bg-tertiary rounded-full text-sm text-text-tertiary">
                  #chill
                </span>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Chat */}
          <div className="col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-8"
            >
              <Chat
                messages={messages}
                currentUserId="current-user"
                onSendMessage={handleSendMessage}
                onSendGift={() => setShowGiftModal(true)}
                className="h-[calc(100vh-8rem)]"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      <Modal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        title="Send a Gift"
        size="md"
      >
        <GiftSelector
          onSelectGift={(gift) => {
            console.log('Sending gift:', gift);
            setShowGiftModal(false);
            // Add gift message to chat
            const giftMessage: ChatMessage = {
              id: Date.now().toString(),
              userId: 'current-user',
              username: 'You',
              message: '',
              timestamp: new Date(),
              type: 'gift',
              metadata: {
                giftName: gift.name,
                amount: 1,
              },
            };
            setMessages((prev) => [...prev, giftMessage]);
          }}
        />
      </Modal>

      {/* Gift Animation Overlay */}
      <GiftAnimation />
    </div>
  );
};
