import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Gift, defaultGifts } from './GiftAnimation';
import { Button } from '../Button';

export interface GiftSelectorProps {
  gifts?: Gift[];
  onSelectGift: (gift: Gift) => void;
  className?: string;
}

export const GiftSelector: React.FC<GiftSelectorProps> = ({
  gifts = defaultGifts,
  onSelectGift,
  className,
}) => {
  return (
    <div className={cn('bg-surface-primary rounded-2xl p-6 border border-border-subtle', className)}>
      <h3 className="text-lg font-semibold mb-4">Send a Gift</h3>

      <div className="grid grid-cols-3 gap-3">
        {gifts.map((gift, index) => (
          <motion.button
            key={gift.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectGift(gift)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border-default hover:border-brand-primary transition-all bg-surface-secondary hover:bg-surface-tertiary"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${gift.color}40, ${gift.color}20)`,
                color: gift.color,
              }}
            >
              {gift.icon}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">{gift.name}</p>
              <p className="text-xs text-text-tertiary">{gift.value} coins</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-tertiary">Your Balance</p>
          <p className="text-lg font-bold text-text-primary">1,250 coins</p>
        </div>
      </div>
    </div>
  );
};
