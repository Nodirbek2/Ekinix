'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost' | 'dark-ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1F3D2B] hover:bg-[#162E20] text-[#FAF7F0] border border-[#1F3D2B] shadow-xs hover:shadow-sm focus-visible:ring-[#1F3D2B]/30',
  accent:
    'bg-[#D9A441] hover:bg-[#C59132] text-[#1F3D2B] border border-[#D9A441] shadow-xs hover:shadow-sm focus-visible:ring-[#D9A441]/40',
  secondary:
    'bg-white hover:bg-[#F5EFE6] text-[#1F3D2B] border border-[#E4D9C4] shadow-xs hover:shadow-sm hover:border-[#D4C4A8] focus-visible:ring-[#1F3D2B]/20',
  destructive:
    'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 shadow-xs focus-visible:ring-rose-400/30',
  ghost:
    'bg-transparent hover:bg-[#1F3D2B]/5 text-[#5C6B5F] hover:text-[#1F3D2B] border border-transparent focus-visible:ring-[#1F3D2B]/20',
  'dark-ghost':
    'bg-transparent hover:bg-white/10 text-[#FAF7F0]/80 hover:text-white border border-transparent focus-visible:ring-white/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 font-medium min-h-[30px]',
  sm: 'px-3.5 py-1.5 text-xs sm:text-sm rounded-xl gap-1.5 font-bold min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2 font-bold min-h-[42px]',
  lg: 'px-5 py-3 text-base rounded-xl gap-2.5 font-bold min-h-[48px]',
  icon: 'p-2 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center',
  'icon-sm': 'p-1.5 rounded-lg min-w-[32px] min-h-[32px] flex items-center justify-center',
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
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none cursor-pointer',
          'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
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
