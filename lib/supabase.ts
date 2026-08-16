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
  farm_type?: 'smallholder' | 'commercial';
  primary_crops?: string[];
  created_at?: string;
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

export interface MarketplaceListing {
  id: string;
  farmer_id?: string;
  farmer_name: string;
  crop_name: string;
  category: 'sabzavot' | 'meva' | 'don' | 'paxta' | 'boshqa' | string;
  price_uzs_per_unit?: number | null;
  unit: 'kg' | 'tonna' | 'qop' | 'dona' | 'quti' | string;
  total_quantity: number;
  expected_date?: string;
  location_region: string;
  phone_contact: string;
  telegram_contact?: string;
  description?: string;
  image_url?: string;
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Marketplace viewable by everyone." ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post listings." ON public.marketplace_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

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
`;
