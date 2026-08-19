'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Sprout, LucideIcon } from 'lucide-react';
import { Button } from './Button';

// ============================================================================
// 1. UNIFIED LOADING SPINNER & SECTION LOADER
// ============================================================================
interface SectionLoaderProps {
  message?: string;
  subMessage?: string;
  minHeight?: string;
  className?: string;
}

export const SectionLoader: React.FC<SectionLoaderProps> = ({
  message = "Ma'lumotlar yuklanmoqda...",
  subMessage,
  minHeight = "min-h-[220px]",
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF7F0] rounded-2xl border border-[#E4D9C4] ${minHeight} ${className}`}
    >
      <div className="relative flex items-center justify-center mb-3">
        <div className="w-10 h-10 border-3 border-[#E4D9C4] border-t-[#1F3D2B] border-r-[#D9A441] rounded-full animate-spin" />
        <Sprout className="w-4 h-4 text-[#1F3D2B] absolute" />
      </div>
      <p className="text-sm font-bold text-[#1F3D2B]">{message}</p>
      {subMessage && (
        <p className="text-xs text-[#6C7C6F] mt-1 max-w-sm">{subMessage}</p>
      )}
      <span className="sr-only">Yuklanmoqda...</span>
    </div>
  );
};

// ============================================================================
// 2. UNIFIED SKELETON LOADERS
// ============================================================================
export const CardSkeleton: React.FC<{ count?: number; height?: string; className?: string }> = ({
  count = 3,
  height = "h-56",
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5",
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`bg-white rounded-2xl border border-[#E4D9C4] p-5 shadow-xs flex flex-col justify-between space-y-4 animate-pulse ${height}`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-1/2 h-5 bg-[#F0E8D8] rounded-md" />
              <div className="w-16 h-6 bg-[#F0E8D8] rounded-full" />
            </div>
            <div className="w-full h-24 bg-[#FAF7F0] rounded-xl border border-[#E4D9C4]/50" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="h-4 bg-[#F0E8D8] rounded" />
              <div className="h-4 bg-[#F0E8D8] rounded" />
            </div>
          </div>
          <div className="h-9 bg-[#F0E8D8] rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-2.5 animate-pulse">
      <div className="h-10 bg-[#F0E8D8] rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-white rounded-xl border border-[#E4D9C4] w-full flex items-center px-4 gap-4">
          <div className="w-1/4 h-4 bg-[#F0E8D8] rounded" />
          <div className="w-1/4 h-4 bg-[#FAF7F0] rounded" />
          <div className="w-1/4 h-4 bg-[#F0E8D8] rounded" />
          <div className="w-1/4 h-4 bg-[#FAF7F0] rounded" />
        </div>
      ))}
    </div>
  );
};

export const WeatherStripSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="p-3.5 rounded-2xl bg-white border border-[#E4D9C4] h-32 flex flex-col justify-between items-center">
          <div className="w-12 h-3 bg-[#F0E8D8] rounded" />
          <div className="w-8 h-8 bg-[#FAF7F0] rounded-full" />
          <div className="w-14 h-4 bg-[#F0E8D8] rounded" />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// 3. UNIFIED EMPTY STATE
// ============================================================================
interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
  badge?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = "",
  badge,
}) => {
  const renderIcon = () => {
    if (!icon) {
      return <Sprout className="w-7 h-7 text-[#D9A441]" />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComp = icon as LucideIcon;
    return <IconComp className="w-7 h-7 text-[#D9A441]" />;
  };

  return (
    <div className={`py-12 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-[#E4D9C4] space-y-4 max-w-xl mx-auto shadow-xs ${className}`}>
      <div className="w-14 h-14 bg-[#F0E8D8] text-[#D9A441] rounded-2xl flex items-center justify-center mx-auto border border-[#E4D9C4]">
        {renderIcon()}
      </div>

      {badge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#D9A441]/15 text-[#B8852B] rounded-full text-xs font-bold uppercase tracking-wider">
          {badge}
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F3D2B]">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#6C7C6F] leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>

      {(onAction && actionText) || (onSecondaryAction && secondaryActionText) ? (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onAction && actionText && (
            <Button
              variant="accent"
              size="md"
              onClick={onAction}
              leftIcon={actionIcon}
            >
              {actionText}
            </Button>
          )}

          {onSecondaryAction && secondaryActionText && (
            <Button
              variant="secondary"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};

// ============================================================================
// 4. UNIFIED ERROR STATE WITH RETRY
// ============================================================================
interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Ma'lumotlarni yuklashda xatolik yuz berdi",
  message,
  onRetry,
  retryText = "Qayta urinish",
  className = "",
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={`p-4 bg-rose-50/90 border border-rose-200 rounded-xl text-rose-900 flex items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="truncate font-medium">{message}</span>
        </div>
        {onRetry && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            className="shrink-0 text-xs py-1 px-2.5"
          >
            {retryText}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`py-10 px-6 text-center bg-rose-50/60 rounded-2xl border border-rose-200 space-y-4 max-w-xl mx-auto shadow-xs ${className}`}>
      <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h4 className="font-serif text-lg sm:text-xl font-bold text-rose-950">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-rose-800 leading-relaxed max-w-md mx-auto">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            leftIcon={<RefreshCw className="w-4 h-4 text-[#D9A441]" />}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};
