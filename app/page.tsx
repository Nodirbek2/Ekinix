'use client';

import React, { useState, useEffect } from 'react';
import { Language, translations } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Sidebar, NavTabId } from '@/components/Sidebar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { InteractiveDemo } from '@/components/InteractiveDemo';
import { FarmerDashboardSection } from '@/components/FarmerDashboardSection';
import { MyFieldsSection } from '@/components/MyFieldsSection';
import { AgronomistDashboardSection } from '@/components/AgronomistDashboardSection';
import { ServicePlansSection } from '@/components/ServicePlansSection';
import { GovernmentProgramsSection } from '@/components/GovernmentProgramsSection';
import { WeatherIrrigationSection } from '@/components/WeatherIrrigationSection';
import { MarketplaceSection } from '@/components/MarketplaceSection';
import { ChatSection } from '@/components/ChatSection';
import { CropGuideSection } from '@/components/CropGuideSection';
import { AuthModal } from '@/components/AuthModal';
import { FarmerOnboardingModal } from '@/components/FarmerOnboardingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TelegramNotificationModal } from '@/components/TelegramNotificationModal';
import { SupabaseSetupModal } from '@/components/SupabaseSetupModal';
import { Footer } from '@/components/Footer';
import { FarmerProfile, FieldRecord, MarketplaceListing, isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function Home() {
  const [currentLang, setCurrentLang] = useState<Language>('uz');
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dbModalOpen, setDbModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<FarmerProfile | null>(null);
  const [activeSelectedField, setActiveSelectedField] = useState<FieldRecord | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedChatListing, setSelectedChatListing] = useState<MarketplaceListing | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const t = translations[currentLang];

  // Read URL search params on mount for deep linking (e.g. ?tab=marketplace&listing=XYZ or ?tab=chat&chatId=ABC)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const listingParam = params.get('listing');
        const chatParam = params.get('chatId');

        if (tabParam && ['dashboard', 'fields', 'agronomist', 'plans', 'subsidies', 'weather', 'marketplace', 'chat', 'guides'].includes(tabParam)) {
          setActiveTab(tabParam as NavTabId);
        }
        if (listingParam) {
          setSelectedListingId(listingParam);
        }
        if (chatParam) {
          setSelectedChatId(chatParam);
        }
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Invalidate Leaflet maps when navigating to map-dependent tabs
  useEffect(() => {
    if (activeTab === 'fields' || activeTab === 'dashboard') {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('resize'));
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // =========================================================================
  // CENTRALIZED SESSION SYNC — single function used by useEffect and handleAuthSuccess
  // =========================================================================
  const syncSession = React.useCallback(async (sessionUser: any) => {
    if (!sessionUser) return;
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const userId = sessionUser.id;
    const userMeta = sessionUser.user_metadata || {};

    // 1. Always query the canonical farmers record for real profile data
    const { data: dbFarmer } = await client
      .from('farmers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Use the registered region from the DB row — never fall back to a different user's metadata
    const actualRegion = dbFarmer?.region || userMeta.region || null;

    const profile: FarmerProfile = {
      id: dbFarmer?.id || userId,
      user_id: userId,
      full_name: dbFarmer?.full_name || userMeta.full_name || 'Dehqon',
      phone: dbFarmer?.phone || userMeta.phone || sessionUser.email || '',
      region: actualRegion || "Toshkent viloyati",
      farm_type: dbFarmer?.farm_type || userMeta.farm_type || 'smallholder',
      primary_crops: dbFarmer?.primary_crops || userMeta.primary_crops || ['cotton', 'wheat'],
      telegram_chat_id: dbFarmer?.telegram_chat_id,
    };

    setUserProfile(profile);
    localStorage.setItem('ekinix_farmer_profile', JSON.stringify(profile));

    // 2. Query ALL fields tied to this farmer.
    // The `fields` table has NO `user_id` column — it only has `farmer_id`.
    // Join path: auth.user → farmers.user_id → farmers.id → fields.farmer_id
    let fieldsQuery = client.from('fields').select('*');
    if (dbFarmer?.id) {
      fieldsQuery = fieldsQuery.eq('farmer_id', dbFarmer.id);
    } else {
      // No farmer record yet — there cannot be any fields
      localStorage.setItem('ekinix_farmer_fields', JSON.stringify([]));
      return;
    }

    const { data: dbFields, error: fieldsError } = await fieldsQuery.order('created_at', { ascending: false });

    if (fieldsError) {
      console.error('[Ekinix] Fields fetch error:', fieldsError.message);
    }

    // Always write the DB result (even if empty []) — never fall back to stale localStorage
    const parsedFields: FieldRecord[] = (dbFields || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      farmer_id: item.farmer_id,
      name: item.name,
      crop_type: item.crop_type,
      planting_date: item.planting_date || '2026-04-10',
      area_hectares: Number(item.area_hectares) || 1.5,
      region: item.region || profile.region,
      coordinates: item.coordinates_json || item.coordinates || [],
    }));
    localStorage.setItem('ekinix_farmer_fields', JSON.stringify(parsedFields));
  }, []);

  // Load profile & sync Supabase auth session after mount
  useEffect(() => {
    // Optimistically render last known profile from localStorage while DB query runs
    try {
      const savedProfile = localStorage.getItem('ekinix_farmer_profile');
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    } catch { /* ignore */ }

    const client = supabase;
    if (isSupabaseConfigured && client) {
      // Check active session immediately
      client.auth.getSession().then(({ data }) => {
        if (data.session?.user) syncSession(data.session.user);
      });

      // Listen for auth state changes (login, token refresh, logout)
      const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUserProfile(null);
          localStorage.removeItem('ekinix_farmer_profile');
          localStorage.removeItem('ekinix_farmer_fields');
        } else if (session?.user) {
          syncSession(session.user);
        }
      });

      return () => { authListener.subscription.unsubscribe(); };
    }
  }, [syncSession]);

  // Listen for custom tab switch events from inner components (e.g. Dashboard quick links)
  useEffect(() => {
    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetTab = customEvent.detail;
      if (['dashboard', 'fields', 'agronomist', 'plans', 'subsidies', 'weather', 'marketplace', 'chat', 'guides'].includes(targetTab)) {
        setActiveTab(targetTab as NavTabId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('ekinix-switch-tab', handleSwitchTabEvent);

    const handleOpenTelegramEvent = () => { setTelegramModalOpen(true); };
    window.addEventListener('ekinix-open-telegram', handleOpenTelegramEvent);

    return () => {
      window.removeEventListener('ekinix-switch-tab', handleSwitchTabEvent);
      window.removeEventListener('ekinix-open-telegram', handleOpenTelegramEvent);
    };
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = async (profileData: Partial<FarmerProfile>, isNewUser: boolean) => {
    // Delegate fully to syncSession so we get the real DB region and fields
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const { data: sessionData } = await client.auth.getSession();
      if (sessionData.session?.user) {
        await syncSession(sessionData.session.user);
      }
    } else {
      // Offline / unconfigured: use whatever AuthModal gave us (no Supabase)
      const fullProf: FarmerProfile = {
        id: profileData.id || profileData.user_id || `farmer_${Date.now()}`,
        user_id: profileData.user_id,
        full_name: profileData.full_name || 'Dehqon',
        phone: profileData.phone || '',
        region: profileData.region || "Toshkent viloyati",
        farm_type: profileData.farm_type || 'smallholder',
        primary_crops: profileData.primary_crops || ['cotton', 'wheat'],
      };
      setUserProfile(fullProf);
      localStorage.setItem('ekinix_farmer_profile', JSON.stringify(fullProf));
    }

    setActiveTab('dashboard');

    if (isNewUser) {
      setTimeout(() => { setOnboardingOpen(true); }, 500);
    }
  };

  const handleProfileSaved = (updatedProfile: FarmerProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('ekinix_farmer_profile', JSON.stringify(updatedProfile));
  };

  const handleLogout = async () => {
    setUserProfile(null);
    localStorage.removeItem('ekinix_farmer_profile');
    localStorage.removeItem('ekinix_farmer_fields');
    const client = supabase;
    if (isSupabaseConfigured && client) {
      await client.auth.signOut();
    }
  };

  const handleTabSelect = (tab: NavTabId) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // VIEW 1: PUBLIC MARKETING LANDING PAGE (FOR LOGGED-OUT VISITORS)
  // =========================================================================
  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#1A281E]">
        {/* Simplified Public Landing Header */}
        <Header
          isLoggedIn={false}
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          onOpenAuth={handleOpenAuth}
          onOpenDbModal={() => setDbModalOpen(true)}
        />

        {/* Public Landing Sections */}
        <main className="flex-1 w-full">
          <Hero
            currentLang={currentLang}
            onOpenRegister={() => handleOpenAuth('register')}
            onExploreClick={() => handleOpenAuth('login')}
          />
          <HowItWorks
            currentLang={currentLang}
            onOpenRegister={() => handleOpenAuth('register')}
          />
          <InteractiveDemo
            currentLang={currentLang}
            onOpenAuth={handleOpenAuth}
          />
        </main>

        {/* Public Footer */}
        <Footer
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          onOpenDbModal={() => setDbModalOpen(true)}
        />

        {/* Auth Modal (Login / Register) */}
        <AuthModal
          isOpen={authModalOpen}
          mode={authMode}
          onClose={() => setAuthModalOpen(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
          currentLang={currentLang}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Supabase Database Schema & Setup Modal */}
        <SupabaseSetupModal
          isOpen={dbModalOpen}
          onClose={() => setDbModalOpen(false)}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED IN-APP WORKSPACE (FOR LOGGED-IN FARMERS)
  // =========================================================================
  return (
    <div className="min-h-screen flex bg-[#FAF7F0] text-[#1A281E]">
      
      {/* 1. IN-APP NAVIGATION: DESKTOP PERSISTENT SIDEBAR + MOBILE DRAWER */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onTabChange={handleTabSelect}
        userProfile={userProfile}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onOpenTelegram={() => setTelegramModalOpen(true)}
        onLogout={handleLogout}
        onOpenDbModal={() => setDbModalOpen(true)}
      />

      {/* 2. IN-APP CONTENT AREA (OFFSET ON DESKTOP BY SIDEBAR WIDTH) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        
        {/* Streamlined In-App Top Header */}
        <Header
          isLoggedIn={true}
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          userProfile={userProfile}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenTelegram={() => setTelegramModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dedicated Screen View for the Active Tab */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          
          {/* TAB 1: FARMER DASHBOARD (NDVI TELEMETRY & FIELD SENSORS) */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-200">
              <FarmerDashboardSection
                currentLang={currentLang}
                userProfile={userProfile}
                onOpenAuth={handleOpenAuth}
                onNavigateToFields={() => handleTabSelect('fields')}
              />
            </div>
          )}

          {/* TAB 2: MY FIELDS (LEAFLET INTERACTIVE POLYGON DRAWER & REGISTRATION) */}
          {activeTab === 'fields' && (
            <div className="animate-in fade-in duration-200">
              <MyFieldsSection
                currentLang={currentLang}
                userProfile={userProfile}
                onOpenAuth={handleOpenAuth}
              />
            </div>
          )}

          {/* TAB: AGRONOMIST TRIAGE DASHBOARD (TARANIS-STYLE HEALTH TRIAGE & ADVISOR NOTES) */}
          {activeTab === 'agronomist' && (
            <div className="animate-in fade-in duration-200">
              <AgronomistDashboardSection
                currentLang={currentLang}
                userProfile={userProfile}
                onOpenAuth={handleOpenAuth}
              />
            </div>
          )}

          {/* TAB: SERVICE PLANS & TIER UPGRADE (ASOSIY / STANDART / PROFESSIONAL) */}
          {activeTab === 'plans' && (
            <div className="animate-in fade-in duration-200">
              <ServicePlansSection
                currentLang={currentLang}
                userProfile={userProfile}
                onOpenAuth={handleOpenAuth}
                onPlanSelected={(planId) => {
                  if (userProfile) {
                    const validTier: 'free' | 'standart' | 'pro' =
                      planId === 'pro' || planId === 'professional'
                        ? 'pro'
                        : planId === 'standart' || planId === 'standard'
                        ? 'standart'
                        : 'free';
                    const updated: FarmerProfile = { ...userProfile, tier: validTier };
                    setUserProfile(updated);
                    localStorage.setItem('ekinix_farmer_profile', JSON.stringify(updated));
                  }
                }}
              />
            </div>
          )}

          {/* TAB: GOVERNMENT SUBSIDY PROGRAM MATCHING */}
          {activeTab === 'subsidies' && (
            <div className="animate-in fade-in duration-200">
              <GovernmentProgramsSection
                currentLang={currentLang}
                userProfile={userProfile}
                onOpenAuth={handleOpenAuth}
                onNavigateToFields={() => handleTabSelect('fields')}
              />
            </div>
          )}

          {/* TAB 3: WEATHER & PRECISION IRRIGATION (OPEN-METEO 7-DAY FORECAST & MODEL) */}
          {activeTab === 'weather' && (
            <div className="animate-in fade-in duration-200">
              <WeatherIrrigationSection
                currentLang={currentLang}
                initialRegion={userProfile?.region}
                selectedField={activeSelectedField}
                userProfile={userProfile}
                onSelectField={(field) => setActiveSelectedField(field)}
              />
            </div>
          )}

          {/* TAB 4: CROP MARKETPLACE (DIRECT FARMER HARVEST LISTINGS) */}
          {activeTab === 'marketplace' && (
            <div className="animate-in fade-in duration-200">
              <MarketplaceSection
                currentLang={currentLang}
                userProfile={userProfile}
                selectedListingId={selectedListingId}
                onStartChat={(listing) => {
                  setSelectedChatListing(listing);
                  setActiveTab('chat');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}

          {/* TAB: DIRECT CHAT & B2B NEGOTIATIONS */}
          {activeTab === 'chat' && (
            <div className="animate-in fade-in duration-200">
              <ChatSection
                currentLang={currentLang}
                userProfile={userProfile}
                initialListing={selectedChatListing}
                initialChatId={selectedChatId}
                onNavigateToMarketplace={() => handleTabSelect('marketplace')}
              />
            </div>
          )}

          {/* TAB 5: CROP AGRONOMY GUIDES (GROWTH STAGES & BEST PRACTICES) */}
          {activeTab === 'guides' && (
            <div className="animate-in fade-in duration-200">
              <CropGuideSection
                currentLang={currentLang}
                userProfile={userProfile}
                onNavigateToFields={() => handleTabSelect('fields')}
              />
            </div>
          )}

        </main>
      </div>

      {/* MODALS */}
      {/* Farmer Onboarding 3-Step Wizard */}
      <FarmerOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        currentLang={currentLang}
        initialProfile={userProfile}
        onProfileSaved={handleProfileSaved}
        userId={userProfile?.user_id}
        userPhone={userProfile?.phone}
      />

      {/* Farmer Profile & Preferences Settings */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        userProfile={userProfile}
        onOpenTelegramModal={() => setTelegramModalOpen(true)}
        onUpdateProfile={(updated) => {
          if (userProfile) {
            setUserProfile({ ...userProfile, ...updated });
          } else {
            setUserProfile({
              id: `farmer_${Date.now()}`,
              full_name: updated.full_name || 'Dehqon',
              phone: updated.phone || '',
              region: updated.region || 'Toshkent viloyati',
              farm_type: updated.farm_type || 'smallholder',
              primary_crops: updated.primary_crops || ['cotton', 'wheat']
            });
          }
        }}
      />

      {/* Telegram Agro Bot Notification Modal */}
      <TelegramNotificationModal
        isOpen={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        currentLang={currentLang}
        userProfile={userProfile}
        onUpdateProfile={(updated) => {
          if (userProfile) {
            setUserProfile({ ...userProfile, ...updated });
          }
        }}
      />

      {/* Supabase Database Schema & Setup Modal */}
      <SupabaseSetupModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />

    </div>
  );
}
