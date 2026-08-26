'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Info, X } from 'lucide-react';
import { Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type TooltipPreset =
  | 'ndvi'
  | 'soil_moisture'
  | 'irrigation_advice'
  | 'water_efficiency'
  | 'growth_stage'
  | 'frost_risk';

export interface InfoTooltipProps {
  /** Pre-configured educational agronomist definitions */
  preset?: TooltipPreset;
  /** Custom heading / title */
  title?: string;
  /** Custom description / explanation */
  content?: string | React.ReactNode;
  /** Active UI Language (defaults to 'uz') */
  lang?: Language | 'uz' | 'ru' | 'en';
  /** Custom trigger button styling */
  className?: string;
  /** Size of trigger icon button */
  size?: 'xs' | 'sm' | 'md';
  /** Visual variant of icon */
  iconVariant?: 'help' | 'info';
  /** Optional custom button trigger */
  children?: React.ReactNode;
  /** Unique element ID for accessibility & testing */
  id?: string;
  /** Custom tooltip panel max width */
  maxWidth?: number;
  /** Visual badge scale display (e.g. 0.0 - 1.0 NDVI ranges) */
  showScale?: boolean;
}

interface PresetData {
  title: Record<string, string>;
  text: Record<string, string>;
  scale?: {
    min: string;
    mid: string;
    max: string;
    minLabel: Record<string, string>;
    midLabel: Record<string, string>;
    maxLabel: Record<string, string>;
  };
}

const PRESETS: Record<TooltipPreset, PresetData> = {
  ndvi: {
    title: {
      uz: "NDVI (O'simlik salomatligi indeksi)",
      ru: 'NDVI (Индекс вегетации)',
      en: 'NDVI (Vegetation Health Index)',
    },
    text: {
      uz: "NDVI (O'simlik salomatligi indeksi) — sun'iy yo'ldosh orqali o'simlikning necha darajada sog'lom va yashil ekanini o'lchaydigan xalqaro ko'rsatkich. 0 dan 1 gacha bo'lib, 0.6 dan yuqorisi sog'lom o'simlikni bildiradi.",
      ru: 'NDVI — международный спутниковый показатель густоты и здоровья биомассы. Варьируется от 0 до 1, значение выше 0.6 указывает на здоровые и развитые растения.',
      en: 'NDVI is an international satellite metric measuring plant vigor and green biomass from 0 to 1. Values above 0.6 indicate healthy, thriving crops.',
    },
    scale: {
      min: '0.0 – 0.3',
      mid: '0.3 – 0.6',
      max: '> 0.6',
      minLabel: {
        uz: 'Quruq / Yer',
        ru: 'Сухо / Земля',
        en: 'Bare / Dry',
      },
      midLabel: {
        uz: "O'rtacha / Stress",
        ru: 'Умеренно / Стресс',
        en: 'Moderate / Stress',
      },
      maxLabel: {
        uz: "Sog'lom yashil",
        ru: 'Здоровый покров',
        en: 'Healthy canopy',
      },
    },
  },
  soil_moisture: {
    title: {
      uz: 'Taxminiy tuproq namligi',
      ru: 'Оценочная влажность почвы',
      en: 'Estimated Soil Moisture',
    },
    text: {
      uz: "Bu ko'rsatkich Open-Meteo agrometeorologik ildiz qatlami modeli va Sentinel-2 NDVI (o'simlik salomatligi) asosida hisoblangan taxminiy baho bo'lib, to'g'ridan-to'g'ri tuproq sensori o'lchovi emas.",
      ru: 'Этот показатель рассчитан на основе агрометеорологической модели корневого слоя Open-Meteo и индекса Sentinel-2 NDVI, а не прямого физического датчика почвы.',
      en: 'This indicator is an agronomic estimate calculated from Open-Meteo root-zone physical modeling and Sentinel-2 NDVI canopy hydration, not an in-ground physical probe.',
    },
  },
  irrigation_advice: {
    title: {
      uz: "Aqlli sug'orish tavsiyasi",
      ru: 'Рекомендация по поливу',
      en: 'Smart Irrigation Recommendation',
    },
    text: {
      uz: "Ekin turi, uning joriy o'sish fazasi, Sentinel-2 NDVI indeksi, tuproq namligi va 48 soatlik kutilayotgan yog'ingarchilik prognozi tahlili asosida hisoblangan optimal sug'orish normasi (m³/ga).",
      ru: 'Оптимальная норма полива (м³/га), рассчитанная на основе культуры, фазы вегетации, индекса NDVI, влажности и 48-часового прогноза осадков.',
      en: 'Optimal irrigation volume (m³/ha) calculated from crop phase, Sentinel-2 NDVI vigor, soil moisture, and 48-hour precipitation forecast.',
    },
  },
  water_efficiency: {
    title: {
      uz: 'Suv tejamkorligi',
      ru: 'Экономия водных ресурсов',
      en: 'Water Conservation Efficiency',
    },
    text: {
      uz: "An'anaviy yoppasiga bostirib sug'orish me'yorlariga nisbatan tejalgan suv miqdori (m³) va energiya samaradorligi ko'rsatkichi.",
      ru: 'Количество сэкономленной поливной воды (м³) и процент эффективности по сравнению с традиционным затоплением.',
      en: 'Volume of conserved water (m³) and agronomic efficiency gained compared to traditional flood irrigation.',
    },
  },
  growth_stage: {
    title: {
      uz: "Ekin o'sish bosqichi (BBCH)",
      ru: 'Фаза роста культуры (BBCH)',
      en: 'Crop Growth Stage (BBCH)',
    },
    text: {
      uz: "Ekish sanasidan boshlab o'tgan kunlar va hududiy harorat yig'indisi (GDD) asosida aniqlangan biologik rivojlanish fazasi.",
      ru: 'Биологическая фаза развития растений, рассчитанная от даты посева и суммы эффективных температур.',
      en: 'Biological development stage calculated from sowing date and regional growing degree-days (GDD).',
    },
  },
  frost_risk: {
    title: {
      uz: 'Sovuq urish xavfi',
      ru: 'Риск заморозков',
      en: 'Frost Alert Risk',
    },
    text: {
      uz: "Tungi yoki erta tonggi havo harorati 0°C dan pasayishi va shamol tezligi past bo'lgan holatlarda ekin barglari va shoxlariga sovuq shikast yetish xavfi.",
      ru: 'Вероятность ночного понижения температуры ниже 0°C, угрожающая повреждением цветков и молодых побегов.',
      en: 'Probability of sub-zero night temperatures threatening tender crop shoots and flower buds.',
    },
  },
};

const emptySubscribe = () => () => {};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  preset = 'ndvi',
  title,
  content,
  lang = 'uz',
  className,
  size = 'xs',
  iconVariant = 'help',
  children,
  id,
  maxWidth = 300,
  showScale = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom'; arrowLeft: number }>({
    top: 0,
    left: 0,
    placement: 'bottom',
    arrowLeft: 16,
  });

  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveLang = (lang === 'ru' || lang === 'en' ? lang : 'uz') as 'uz' | 'ru' | 'en';
  const presetData = PRESETS[preset] || PRESETS.ndvi;

  const resolvedTitle = title || presetData.title[effectiveLang] || presetData.title.uz;
  const resolvedContent = content || presetData.text[effectiveLang] || presetData.text.uz;
  const resolvedScale = showScale && presetData.scale ? presetData.scale : null;

  // Calculate coordinates with screen boundary clamping
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const actualWidth = Math.min(maxWidth, viewportWidth - 24);
    const estimatedHeight = 180; // approximate height for boundary detection

    // Determine vertical placement: if trigger is in lower half or less than 200px from bottom, place on top
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const placeTop = spaceBelow < estimatedHeight && spaceAbove > estimatedHeight;

    const top = placeTop
      ? Math.max(8, triggerRect.top - 8) // will transform translateY(-100%)
      : Math.min(viewportHeight - 20, triggerRect.bottom + 8);

    // Center horizontally with trigger, clamped within viewport [12px, viewportWidth - actualWidth - 12px]
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const idealLeft = triggerCenter - actualWidth / 2;
    const clampedLeft = Math.max(12, Math.min(idealLeft, viewportWidth - actualWidth - 12));

    // Arrow relative position inside tooltip
    const arrowLeft = Math.max(12, Math.min(triggerCenter - clampedLeft, actualWidth - 12));

    setCoords({
      top,
      left: clampedLeft,
      placement: placeTop ? 'top' : 'bottom',
      arrowLeft,
    });
  }, [maxWidth]);

  const handleOpen = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  const handleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  }, []);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        setIsOpen(false);
      } else {
        handleOpen();
      }
    },
    [isOpen, handleOpen]
  );

  // Close on outside click, window resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  const sizeClasses = {
    xs: 'w-4 h-4 p-0 text-[10px]',
    sm: 'w-4.5 h-4.5 p-0 text-xs',
    md: 'w-5 h-5 p-0 text-sm',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const tooltipPortal =
    isOpen && isClient && typeof document !== 'undefined' ? (
      createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          id={id ? `${id}-popover` : undefined}
          onMouseEnter={() => {
            if (closeTimerRef.current) {
              clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
          }}
          onMouseLeave={handleClose}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${Math.min(maxWidth, typeof window !== 'undefined' ? window.innerWidth - 24 : maxWidth)}px`,
            transform: coords.placement === 'top' ? 'translateY(-100%)' : 'none',
            zIndex: 99999,
          }}
          className="animate-in fade-in zoom-in-95 duration-150 pointer-events-auto select-text"
        >
          {/* Card Container */}
          <div className="bg-[#FAF7F0] border border-[#1F3D2B]/30 rounded-xl p-3.5 shadow-xl text-slate-800 relative space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-[#E4D9C4] pb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-4 h-4 rounded-full bg-[#1F3D2B] text-[#FAF7F0] flex items-center justify-center text-[10px] font-bold shrink-0">
                  ?
                </span>
                <h4 className="text-xs font-bold text-[#1F3D2B] truncate tracking-tight">
                  {resolvedTitle}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-200/50 transition-colors shrink-0 cursor-pointer"
                aria-label="Yopish"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Explanation Body */}
            <div className="text-[11.5px] leading-relaxed text-[#1F3D2B]/90 font-normal">
              {typeof resolvedContent === 'string' ? (
                <p>{resolvedContent}</p>
              ) : (
                resolvedContent
              )}
            </div>

            {/* Optional Scale Bar for NDVI */}
            {resolvedScale && (
              <div className="pt-2 border-t border-[#E4D9C4] space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#6C7C6F] flex items-center justify-between">
                  <span>{effectiveLang === 'ru' ? 'Шкала оценки' : effectiveLang === 'en' ? 'Vigor Scale' : "Baholash shkalasi"}</span>
                  <span className="font-mono text-[9px] text-[#1F3D2B]">0.0 → 1.0</span>
                </div>
                
                {/* Visual Color Bar */}
                <div className="h-2 w-full rounded-full flex overflow-hidden border border-slate-300">
                  <div className="w-[30%] bg-amber-600" title="0.0 - 0.3" />
                  <div className="w-[30%] bg-amber-400" title="0.3 - 0.6" />
                  <div className="w-[40%] bg-emerald-600" title="> 0.6" />
                </div>

                {/* Legend Labels */}
                <div className="grid grid-cols-3 gap-1 text-[9.5px] text-center font-medium">
                  <div className="bg-amber-50 text-amber-900 rounded px-1 py-0.5 border border-amber-200">
                    <span className="font-mono font-bold block">{resolvedScale.min}</span>
                    <span className="truncate block text-[9px]">{resolvedScale.minLabel[effectiveLang] || resolvedScale.minLabel.uz}</span>
                  </div>
                  <div className="bg-amber-50/80 text-amber-950 rounded px-1 py-0.5 border border-amber-200">
                    <span className="font-mono font-bold block">{resolvedScale.mid}</span>
                    <span className="truncate block text-[9px]">{resolvedScale.midLabel[effectiveLang] || resolvedScale.midLabel.uz}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-900 rounded px-1 py-0.5 border border-emerald-300">
                    <span className="font-mono font-bold block">{resolvedScale.max}</span>
                    <span className="truncate block text-[9px]">{resolvedScale.maxLabel[effectiveLang] || resolvedScale.maxLabel.uz}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-label={resolvedTitle}
        onClick={handleToggle}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0',
          'text-slate-400 hover:text-[#1F3D2B] bg-slate-100/80 hover:bg-slate-200 border border-slate-300/70',
          'focus:outline-none focus:ring-1 focus:ring-[#1F3D2B]/40',
          sizeClasses[size],
          className
        )}
      >
        {children ? (
          children
        ) : iconVariant === 'info' ? (
          <Info className={iconSizes[size]} />
        ) : (
          <HelpCircle className={iconSizes[size]} />
        )}
      </button>
      {tooltipPortal}
    </>
  );
};
