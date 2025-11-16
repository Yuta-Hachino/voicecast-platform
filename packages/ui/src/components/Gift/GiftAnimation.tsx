import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Zap, Trophy, Crown, Gem } from 'lucide-react';

export interface Gift {
  id: string;
  name: string;
  icon: React.ReactNode;
  value: number;
  color: string;
}

export const defaultGifts: Gift[] = [
  {
    id: 'heart',
    name: 'Heart',
    icon: <Heart className="w-6 h-6" />,
    value: 1,
    color: '#EF4444',
  },
  {
    id: 'star',
    name: 'Star',
    icon: <Star className="w-6 h-6" />,
    value: 5,
    color: '#F59E0B',
  },
  {
    id: 'zap',
    name: 'Lightning',
    icon: <Zap className="w-6 h-6" />,
    value: 10,
    color: '#3B82F6',
  },
  {
    id: 'trophy',
    name: 'Trophy',
    icon: <Trophy className="w-6 h-6" />,
    value: 50,
    color: '#10B981',
  },
  {
    id: 'crown',
    name: 'Crown',
    icon: <Crown className="w-6 h-6" />,
    value: 100,
    color: '#8B5CF6',
  },
  {
    id: 'gem',
    name: 'Diamond',
    icon: <Gem className="w-6 h-6" />,
    value: 500,
    color: '#EC4899',
  },
];

interface AnimatedGift {
  id: string;
  gift: Gift;
  x: number;
  y: number;
}

export interface GiftAnimationProps {
  gifts?: Gift[];
  className?: string;
}

export const GiftAnimation: React.FC<GiftAnimationProps> = ({
  gifts = defaultGifts,
  className,
}) => {
  const [animatedGifts, setAnimatedGifts] = useState<AnimatedGift[]>([]);

  const triggerGift = useCallback((gift: Gift) => {
    const id = `${gift.id}-${Date.now()}-${Math.random()}`;
    const x = Math.random() * 80 + 10; // 10-90% from left
    const y = Math.random() * 30 + 60; // 60-90% from top (start from bottom)

    setAnimatedGifts((prev) => [...prev, { id, gift, x, y }]);

    // Remove after animation
    setTimeout(() => {
      setAnimatedGifts((prev) => prev.filter((g) => g.id !== id));
    }, 3000);
  }, []);

  return (
    <div className={className}>
      {/* Animation Container */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <AnimatePresence>
          {animatedGifts.map((animatedGift) => (
            <motion.div
              key={animatedGift.id}
              initial={{
                x: `${animatedGift.x}vw`,
                y: `${animatedGift.y}vh`,
                scale: 0.5,
                opacity: 0,
              }}
              animate={{
                x: `${animatedGift.x}vw`,
                y: '10vh',
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1, 0],
                rotate: [0, 10, -10, 0],
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
              }}
              transition={{
                duration: 3,
                ease: 'easeOut',
                times: [0, 0.2, 0.8, 1],
              }}
              className="absolute"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="flex flex-col items-center"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                  style={{
                    background: `radial-gradient(circle, ${animatedGift.gift.color}40, ${animatedGift.gift.color}20)`,
                    color: animatedGift.gift.color,
                    boxShadow: `0 0 30px ${animatedGift.gift.color}60`,
                  }}
                >
                  {animatedGift.gift.icon}
                </div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm"
                >
                  {animatedGift.gift.name}
                </motion.p>
              </motion.div>

              {/* Sparkles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI) / 4) * 50,
                    y: Math.sin((i * Math.PI) / 4) * 50,
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5 + i * 0.05,
                  }}
                  className="absolute top-8 left-8 w-2 h-2 rounded-full"
                  style={{ backgroundColor: animatedGift.gift.color }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Export trigger function for external use
export const useGiftAnimation = () => {
  const [controller, setController] = useState<{
    trigger: (gift: Gift) => void;
  } | null>(null);

  const registerController = useCallback((trigger: (gift: Gift) => void) => {
    setController({ trigger });
  }, []);

  return {
    triggerGift: controller?.trigger,
    registerController,
  };
};
