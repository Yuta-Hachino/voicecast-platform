import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90 focus-visible:ring-brand-primary',
        secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary focus-visible:ring-surface-tertiary',
        ghost: 'hover:bg-surface-primary/10 hover:text-text-primary focus-visible:ring-surface-primary',
        danger: 'bg-semantic-error text-white hover:bg-semantic-error/90 focus-visible:ring-semantic-error',
        success: 'bg-semantic-success text-white hover:bg-semantic-success/90 focus-visible:ring-semantic-success',
        glass: 'bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md gap-1',
        sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
        md: 'h-11 px-4 text-base rounded-lg gap-2',
        lg: 'h-13 px-6 text-lg rounded-xl gap-2.5',
        xl: 'h-16 px-8 text-xl rounded-2xl gap-3',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, 'size'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    children,
    ...props
  }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit"
          >
            <Loader2 className="animate-spin" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 20} />
          </motion.div>
        )}

        <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export { Button, buttonVariants };
