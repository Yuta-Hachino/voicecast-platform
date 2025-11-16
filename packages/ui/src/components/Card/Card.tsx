import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'rounded-2xl border transition-all',
  {
    variants: {
      variant: {
        default: 'bg-surface-primary border-border-subtle',
        elevated: 'bg-surface-secondary border-border-default shadow-lg',
        glass: 'bg-white/5 backdrop-blur-xl border-white/10',
        gradient: 'bg-gradient-to-br from-surface-primary to-surface-tertiary border-border-subtle',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hoverable: {
        true: 'cursor-pointer hover:shadow-xl hover:border-border-strong',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hoverable: false,
    },
  }
);

export interface CardProps
  extends Omit<HTMLMotionProps<'div'>, 'children'>,
    VariantProps<typeof cardVariants> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  animate?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    className,
    variant,
    padding,
    hoverable,
    children,
    header,
    footer,
    animate = true,
    ...props
  }, ref) => {
    const Wrapper = animate ? motion.div : 'div';

    return (
      <Wrapper
        ref={ref}
        className={cn(cardVariants({ variant, padding, hoverable, className }))}
        {...(animate && {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          whileHover: hoverable ? { scale: 1.02 } : undefined,
          transition: { duration: 0.2 },
        })}
        {...props}
      >
        {header && (
          <div className="mb-4 pb-4 border-b border-border-subtle">
            {header}
          </div>
        )}

        <div className={cn(header && 'mb-4', footer && 'mb-4')}>
          {children}
        </div>

        {footer && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            {footer}
          </div>
        )}
      </Wrapper>
    );
  }
);

Card.displayName = 'Card';
export { Card, cardVariants };
