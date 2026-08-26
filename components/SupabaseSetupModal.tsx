'use client';

import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA, isSupabaseConfigured } from '@/lib/supabase';
import { Database, Copy, Check, ExternalLink, X, Terminal } from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-2xl w-full p-6 sm:p-8 border-2 border-[#1F3D2B] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#6C7C6F] hover:text-[#1F3D2B] rounded-full hover:bg-[#F0E8D8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#E4D9C4] pb-4">
          <div className="p-3 rounded-xl bg-[#1F3D2B] text-[#D9A441]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#1F3D2B]">
              Supabase Baza Sozlamalari (SQL Schema)
            </h3>
            <p className="text-xs text-[#6C7C6F] font-medium">
              Ekinix platformasini real Supabase loyihangizga ulash yo&apos;riqnomasi
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          isSupabaseConfigured 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {isSupabaseConfigured 
                ? "Supabase bazasiga muvaffaqiyatli ulangan!" 
                : "Supabase API kalitlari .env.example faylida ko'rsatilgan. Kalitlarni kiriting."}
            </span>
          </div>

          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#1F3D2B] hover:underline font-bold"
          >
            <span>Supabase.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 2 Step Instructions */}
        <div className="space-y-3 text-sm text-[#2D3A2F]">
          <h4 className="font-serif text-base font-bold text-[#1F3D2B]">
            📋 2 ta oddiy qadamda bazani yaratish:
          </h4>
          <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm font-medium">
            <li>Supabase.com da yangi loyiha (Project) yarating va loyiha URL hamda Anon Key ini sozlang.</li>
            <li>Quyidagi tayyor SQL kodini nusxalab, Supabase loyihangizdagi <strong>SQL Editor</strong> bo&apos;limiga qo&apos;ying va <strong>RUN</strong> tugmasini bosing.</li>
          </ol>
        </div>

        {/* Copyable SQL Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#1F3D2B]">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#D9A441]" />
              <span>SQL Skripti (farmers, fields, ndvi_readings, marketplace_listings)</span>
            </span>

            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D9A441]" />}
              <span>{copied ? 'Nusxalandi!' : 'SQL Kodu Nusxalash'}</span>
            </button>
          </div>

          <pre className="bg-[#14281C] text-[#E4D9C4] p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-60 border border-[#E4D9C4]/20 select-all">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>

        {/* Close Modal CTA */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full bg-[#1F3D2B] hover:bg-[#14281C] text-[#FAF7F0] font-bold text-sm py-3 rounded-xl transition-colors"
          >
            Tushunarli, yopish
          </button>
        </div>

      </div>
    </div>
  );
};
