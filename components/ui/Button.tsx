'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost' | 'dark-ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-md';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#164E35] text-white hover:bg-[#0F3826] shadow-xs border border-transparent focus-visible:ring-[#164E35]/30',
  accent:
    'bg-slate-900 text-white hover:bg-slate-800 shadow-xs border border-transparent focus-visible:ring-slate-700/30',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-xs focus-visible:ring-slate-300',
  destructive:
    'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 shadow-xs focus-visible:ring-rose-300',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent focus-visible:ring-slate-300',
  'dark-ghost':
    'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent focus-visible:ring-white/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs font-medium rounded-lg gap-1',
  sm: 'h-8 px-3 text-xs font-medium rounded-lg gap-1.5',
  md: 'h-9 px-3.5 text-xs sm:text-sm font-medium rounded-lg gap-2',
  lg: 'h-10 px-4 text-sm font-medium rounded-lg gap-2',
  icon: 'w-9 h-9 rounded-lg p-0 flex items-center justify-center shrink-0',
  'icon-sm': 'w-8 h-8 rounded-lg p-0 flex items-center justify-center shrink-0',
  'icon-md': 'w-9 h-9 rounded-lg p-0 flex items-center justify-center shrink-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-colors duration-150 select-none cursor-pointer',
          'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

