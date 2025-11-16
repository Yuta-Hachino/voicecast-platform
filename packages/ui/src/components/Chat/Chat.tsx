import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, Gift as GiftIcon, Smile } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  type?: 'message' | 'gift' | 'join' | 'system';
  metadata?: {
    giftName?: string;
    giftIcon?: string;
    amount?: number;
  };
}

export interface ChatProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (message: string) => void;
  onSendGift?: (giftId: string) => void;
  placeholder?: string;
  className?: string;
}

export const Chat: React.FC<ChatProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendGift,
  placeholder = 'Send a message...',
  className,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwn = msg.userId === currentUserId;

    if (msg.type === 'system' || msg.type === 'join') {
      return (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center my-2"
        >
          <p className="text-xs text-text-tertiary bg-bg-tertiary px-3 py-1 rounded-full">
            {msg.message}
          </p>
        </motion.div>
      );
    }

    if (msg.type === 'gift') {
      return (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex justify-center my-3"
        >
          <div className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border border-brand-primary/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center">
              {msg.metadata?.giftIcon || <GiftIcon className="w-5 h-5 text-brand-primary" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {msg.username} sent {msg.metadata?.giftName || 'a gift'}
              </p>
              {msg.metadata?.amount && (
                <p className="text-xs text-text-tertiary">
                  x{msg.metadata.amount}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex gap-3 mb-3',
          isOwn && 'flex-row-reverse'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {msg.avatar ? (
            <img
              src={msg.avatar}
              alt={msg.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-xs font-bold">
              {msg.username[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={cn('flex-1 min-w-0', isOwn && 'flex flex-col items-end')}>
          <p className={cn(
            'text-xs font-medium mb-1',
            isOwn ? 'text-text-tertiary' : 'text-text-secondary'
          )}>
            {msg.username}
          </p>

          <div className={cn(
            'inline-block px-4 py-2 rounded-2xl max-w-[80%] break-words',
            isOwn
              ? 'bg-brand-primary text-white rounded-br-sm'
              : 'bg-surface-tertiary text-text-primary rounded-bl-sm'
          )}>
            <p className="text-sm">{msg.message}</p>
          </div>

          <p className="text-xs text-text-tertiary mt-1">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-surface-primary rounded-2xl border border-border-subtle', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-subtle">
        <h3 className="font-semibold text-text-primary">Chat</h3>
        <p className="text-xs text-text-tertiary mt-1">
          {messages.length} messages
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-1"
      >
        <AnimatePresence mode="popLayout">
          {messages.map(renderMessage)}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border-subtle bg-bg-secondary">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              rows={1}
              className="w-full px-4 py-3 bg-bg-tertiary rounded-xl border border-border-default focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-text-primary resize-none"
              style={{ maxHeight: '120px' }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Smile className="w-5 h-5" />}
            />
            {onSendGift && (
              <Button
                variant="ghost"
                size="sm"
                icon={<GiftIcon className="w-5 h-5" />}
                onClick={() => onSendGift('default')}
              />
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-5 h-5" />}
              onClick={handleSend}
              disabled={!inputValue.trim()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
