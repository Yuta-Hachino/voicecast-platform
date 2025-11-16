import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-bg-secondary border-border-default text-text-primary focus:border-brand-primary focus:ring-brand-primary/20',
        filled: 'bg-surface-secondary border-transparent text-text-primary focus:border-brand-primary focus:ring-brand-primary/20',
        ghost: 'bg-transparent border-border-subtle text-text-primary focus:border-brand-primary focus:ring-brand-primary/20',
      },
      inputSize: {
        sm: 'h-9 text-sm px-3',
        md: 'h-11 text-base px-4',
        lg: 'h-13 text-lg px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    inputSize,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    ...props
  }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              inputVariants({ variant, inputSize, className }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-semantic-error focus:border-semantic-error focus:ring-semantic-error/20'
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1.5 text-sm text-semantic-error"
          >
            {error}
          </motion.p>
        )}

        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-tertiary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input, inputVariants };
