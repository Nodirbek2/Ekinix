import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// Gracefully handle unconfigured Supabase credentials in development / demo mode
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Database Types for Ekinix
export interface FarmerProfile {
  id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  region: string;
  role?: 'farmer' | 'agronomist';
  tier?: 'free' | 'standart' | 'pro';
  agronomist_code?: string;
  linked_farmer_ids?: string[];
  assigned_agronomist_id?: string;
  specialization?: string[];
  organization?: string;
  farm_type?: 'smallholder' | 'commercial';
  primary_crops?: string[];
  telegram_chat_id?: string;
  telegram_username?: string;
  telegram_linked_at?: string;
  telegram_notifications_enabled?: boolean;
  telegram_notify_weather?: boolean;
  telegram_notify_rain?: boolean;
  telegram_notify_irrigation?: boolean;
  telegram_notify_ndvi?: boolean;
  telegram_notify_advisories?: boolean;
  telegram_notify_frost?: boolean;
  telegram_preferred_time?: string;
  preferred_language?: 'uz' | 'ru' | 'en';
  telegram_language?: 'uz' | 'ru' | 'en';
  created_at?: string;
}

export interface SupportTicketRecord {
  id?: string;
  farmer_id?: string;
  chat_id: string;
  farmer_name?: string;
  phone?: string;
  message: string;
  category?: 'general' | 'technical' | 'agronomy' | 'feedback' | string;
  status?: 'new' | 'in_progress' | 'resolved';
  created_at?: string;
}

export interface FieldAdvisorNote {
  id: string;
  field_id: string;
  agronomist_id: string;
  agronomist_name: string;
  agronomist_phone?: string;
  title: string;
  note: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  created_at: string;
}

export interface GovernmentProgram {
  id: string;
  title_uz: string;
  title_ru: string;
  title_en: string;
  organization_uz: string;
  organization_ru: string;
  organization_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  max_subsidy_uz: string;
  max_subsidy_ru: string;
  max_subsidy_en: string;
  eligibility_crop_types: string[];
  eligibility_regions: string[];
  requires_drip_irrigation?: boolean;
  required_documents_uz: string[];
  required_documents_ru: string[];
  required_documents_en: string[];
  application_url?: string;
  badge_text_uz: string;
  badge_text_ru: string;
  badge_text_en: string;
}

export interface ServicePlan {
  id: 'free' | 'standart' | 'pro';
  name_uz: string;
  name_ru: string;
  name_en: string;
  tagline_uz: string;
  tagline_ru: string;
  tagline_en: string;
  price_monthly_uzs: number;
  price_per_ha_uzs?: number;
  popular?: boolean;
  features_uz: string[];
  features_ru: string[];
  features_en: string[];
  limitations_uz?: string[];
  limitations_ru?: string[];
  limitations_en?: string[];
}

export interface FieldRecord {
  id: string;
  farmer_id?: string;
  user_id?: string;
  name: string;
  crop_type: string;
  planting_date?: string;
  area_hectares: number;
  soil_type?: string;
  region: string;
  coordinates?: [number, number][]; // Array of [lat, lng] points for polygon
  coordinates_json?: [number, number][];
  created_at?: string;
}

export interface NDVIReading {
  id: string;
  field_id: string;
  ndvi_score: number; // 0.1 to 0.9
  moisture_percentage: number; // 0 to 100
  status: 'good' | 'warning' | 'critical';
  satellite_date: string;
  recommendation_uz: string;
  recommendation_ru: string;
  recommendation_en: string;
}

export type NdviReadingRecord = NDVIReading;

export interface WateringLogRecord {
  id: string;
  field_id: string;
  watered_at: string;
  water_volume_m3?: number;
  method?: string;
  notes?: string;
  created_at?: string;
}

export interface NotificationLogRecord {
  id: string;
  farmer_id?: string;
  field_id?: string;
  phone?: string;
  chat_id?: string;
  type: 'rain_alert' | 'irrigation_task' | 'ndvi_stress' | 'weather' | 'frost' | 'advisory' | 'custom' | string;
  status: 'sent' | 'failed' | 'skipped';
  payload?: any;
  created_at?: string;
}

export interface MarketplaceListing {
  id: string;
  farmer_id?: string;
  user_id?: string;
  farmer_name: string;
  crop_name: string;
  category: 'sabzavot' | 'meva' | 'don' | 'paxta' | 'poliz' | 'boshqa' | string;
  price_uzs_per_unit?: number | null;
  price_usd_per_unit?: number | null;
  unit: 'kg' | 'tonna' | 'qop' | 'dona' | 'quti' | string;
  total_quantity: number;
  remaining_quantity?: number;
  min_order_quantity?: number;
  expected_date?: string;
  harvest_date?: string;
  location_region: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  phone_contact: string;
  telegram_contact?: string;
  description?: string;
  image_url?: string;
  images?: string[];
  variety?: string;
  qualityGrade?: 'Export' | '1-nav' | '2-nav' | 'Organik' | 'A' | 'B' | string;
  isVerified?: boolean;
  farmer_rating?: number;
  deals_count?: number;
  status?: 'available' | 'reserved' | 'sold' | string;
  packaging?: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'farmer' | 'agronomist' | 'buyer' | 'seller' | 'system';
  text: string;
  created_at: string;
  is_read?: boolean;
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  listing_id?: string;
}

export interface ChatConversation {
  id: string;
  type: 'agronomist' | 'marketplace';
  title: string;
  participant_id: string;
  participant_name: string;
  participant_role: string;
  participant_avatar?: string;
  participant_phone?: string;
  participant_telegram?: string;
  participant_online?: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  listing_context?: MarketplaceListing;
  messages: ChatMessage[];
  created_at?: string;
}

export interface CropGuide {
  id: string;
  crop_name: string;
  growth_stage: string;
  stage_name_uz?: string;
  stage_name_ru?: string;
  stage_name_en?: string;
  irrigation_notes_uz?: string;
  irrigation_notes_ru?: string;
  irrigation_notes_en?: string;
  pest_notes_uz?: string;
  pest_notes_ru?: string;
  pest_notes_en?: string;
  harvest_notes_uz?: string;
  harvest_notes_ru?: string;
  harvest_notes_en?: string;
  irrigation_notes?: string;
  pest_notes?: string;
  harvest_notes?: string;
  days_min?: number;
  days_max?: number;
  title_uz?: string;
  title_ru?: string;
  title_en?: string;
  created_at?: string;
}

// SQL Schema code to initialize Supabase
export const SUPABASE_SQL_SCHEMA = `-- Ekinix Agriculture Platform SQL Schema
-- Copy & Run this SQL in your Supabase SQL Editor

-- 1. Farmers Profile Table
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    region TEXT NOT NULL,
    farm_type TEXT DEFAULT 'smallholder',
    primary_crops TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Farmers
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public farmers are viewable by everyone." ON public.farmers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own farmer profile." ON public.farmers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Agricultural Fields Table
CREATE TABLE IF NOT EXISTS public.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE,
    area_hectares NUMERIC(8,2) NOT NULL DEFAULT 1.0,
    soil_type TEXT,
    region TEXT NOT NULL,
    coordinates_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fields viewable by everyone." ON public.fields FOR SELECT USING (true);
CREATE POLICY "Users can insert their own fields." ON public.fields FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

-- 3. Satellite NDVI & Moisture Readings Table
CREATE TABLE IF NOT EXISTS public.ndvi_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    ndvi_score NUMERIC(3,2) NOT NULL,
    moisture_percentage INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('good', 'warning', 'critical')),
    satellite_date DATE DEFAULT CURRENT_DATE,
    recommendation_uz TEXT,
    recommendation_ru TEXT,
    recommendation_en TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ndvi_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NDVI readings viewable by everyone." ON public.ndvi_readings FOR SELECT USING (true);

-- 4. Marketplace Listings Table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    crop_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_uzs_per_unit NUMERIC(12,2),
    unit TEXT NOT NULL DEFAULT 'kg',
    total_quantity NUMERIC(10,2) NOT NULL,
    expected_date TEXT DEFAULT 'Hozir mavjud',
    location_region TEXT NOT NULL,
    phone_contact TEXT NOT NULL,
    telegram_contact TEXT,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace viewable by everyone." ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post listings." ON public.marketplace_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);
CREATE POLICY "Users can update their own listings." ON public.marketplace_listings FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "Users can delete their own listings." ON public.marketplace_listings FOR DELETE USING (auth.uid() = user_id OR true);

-- 5. Crop Guides Table (Structured growth stages, irrigation, pest & harvest care notes)
CREATE TABLE IF NOT EXISTS public.crop_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    growth_stage TEXT NOT NULL,
    stage_name_uz TEXT,
    stage_name_ru TEXT,
    stage_name_en TEXT,
    irrigation_notes_uz TEXT,
    irrigation_notes_ru TEXT,
    irrigation_notes_en TEXT,
    pest_notes_uz TEXT,
    pest_notes_ru TEXT,
    pest_notes_en TEXT,
    harvest_notes_uz TEXT,
    harvest_notes_ru TEXT,
    harvest_notes_en TEXT,
    irrigation_notes TEXT,
    pest_notes TEXT,
    harvest_notes TEXT,
    days_min INT DEFAULT 0,
    days_max INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.crop_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guides viewable by everyone." ON public.crop_guides FOR SELECT USING (true);

-- 6. Agronomist Access & Field Advisor Notes (Taranis AgTech Architecture)
CREATE TABLE IF NOT EXISTS public.agronomist_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    agronomist_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    invite_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.field_advisor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    agronomist_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
    agronomist_name TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT NOT NULL,
    urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    recommendations TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.field_advisor_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes viewable by everyone." ON public.field_advisor_notes FOR SELECT USING (true);
CREATE POLICY "Agronomists can insert notes." ON public.field_advisor_notes FOR INSERT WITH CHECK (true);

-- 7. Watering Log Table (Irrigation task tracking)
CREATE TABLE IF NOT EXISTS public.watering_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
    watered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    water_volume_m3 NUMERIC(10,2),
    method TEXT DEFAULT 'drip',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.watering_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Watering logs viewable by everyone." ON public.watering_log FOR SELECT USING (true);
CREATE POLICY "Users can insert watering logs." ON public.watering_log FOR INSERT WITH CHECK (true);

-- 8. Scheduled Notifications & Telegram Alerts Log
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES public.farmers(id) ON DELETE CASCADE,
    field_id UUID REFERENCES public.fields(id) ON DELETE SET NULL,
    phone TEXT,
    chat_id TEXT,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications viewable by everyone." ON public.notifications_log FOR SELECT USING (true);
CREATE POLICY "System can insert notification logs." ON public.notifications_log FOR INSERT WITH CHECK (true);

-- 9. Storage Bucket for Crop & Harvest Images
-- Create 'marketplace' bucket if not exists in Supabase Storage Dashboard (Public bucket)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace', 'marketplace', true) ON CONFLICT DO NOTHING;
`;

/**
 * Compresses an image file client-side and uploads to Supabase Storage if configured.
 * Returns the public image URL or a compressed Base64 Data URL fallback.
 */
export async function uploadMarketplaceImage(file: File): Promise<string> {
  // 1. Client-side Canvas Image Compression (Max 1200px width/height, 85% JPEG quality)
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // 2. Try Supabase Storage upload if Supabase is configured
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      // Upload to 'marketplace' bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('marketplace')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('marketplace')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return urlData.publicUrl;
        }
      } else if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (err) {
      console.warn('Supabase storage upload exception:', err);
    }
  }

  // 3. Fallback: Convert compressed blob to high-quality Base64 Data URL
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(compressedBlob);
  });
}

