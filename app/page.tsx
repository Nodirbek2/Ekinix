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
import { CropGuideSection } from '@/components/CropGuideSection';
import { AuthModal } from '@/components/AuthModal';
import { FarmerOnboardingModal } from '@/components/FarmerOnboardingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { TelegramNotificationModal } from '@/components/TelegramNotificationModal';
import { SupabaseSetupModal } from '@/components/SupabaseSetupModal';
import { Footer } from '@/components/Footer';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';

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

  const t = translations[currentLang];

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

  // Load profile from localStorage & Supabase session after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedProfile = localStorage.getItem('ekinix_farmer_profile');
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        }
      } catch {
        // ignore
      }
    }, 0);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      client.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const userMeta = data.session.user.user_metadata || {};
          const profile: FarmerProfile = {
            id: data.session.user.id,
            user_id: data.session.user.id,
            full_name: userMeta.full_name || 'Dehqon',
            phone: userMeta.phone || data.session.user.email || '',
            region: userMeta.region || "Toshkent viloyati",
            farm_type: userMeta.farm_type || 'smallholder',
            primary_crops: userMeta.primary_crops || ['cotton', 'wheat'],
          };

          client
            .from('farmers')
            .select('*')
            .eq('user_id', data.session.user.id)
            .single()
            .then(({ data: dbFarmer }) => {
              if (dbFarmer) {
                const updated: FarmerProfile = {
                  id: dbFarmer.id,
                  user_id: dbFarmer.user_id,
                  full_name: dbFarmer.full_name,
                  phone: dbFarmer.phone,
                  region: dbFarmer.region,
                  farm_type: dbFarmer.farm_type || 'smallholder',
                  primary_crops: dbFarmer.primary_crops || ['cotton', 'wheat'],
                };
                setUserProfile(updated);
                localStorage.setItem('ekinix_farmer_profile', JSON.stringify(updated));
              } else {
                setUserProfile(profile);
              }
            });
        }
      });
    }

    return () => clearTimeout(timer);
  }, []);

  // Listen for custom tab switch events from inner components (e.g. Dashboard quick links)
  useEffect(() => {
    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetTab = customEvent.detail;
      if (['dashboard', 'fields', 'agronomist', 'plans', 'subsidies', 'weather', 'marketplace', 'guides'].includes(targetTab)) {
        setActiveTab(targetTab as NavTabId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('ekinix-switch-tab', handleSwitchTabEvent);

    const handleOpenTelegramEvent = () => {
      setTelegramModalOpen(true);
    };
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

  const handleAuthSuccess = (profileData: Partial<FarmerProfile>, isNewUser: boolean) => {
    const fullProf: FarmerProfile = {
      id: profileData.id || profileData.user_id || `farmer_${Date.now()}`,
      user_id: profileData.user_id,
      full_name: profileData.full_name || 'Dehqon',
      phone: profileData.phone || '+998 90 123 45 67',
      region: profileData.region || "Toshkent viloyati",
      farm_type: profileData.farm_type || 'smallholder',
      primary_crops: profileData.primary_crops || ['cotton', 'wheat'],
    };

    setUserProfile(fullProf);
    setActiveTab('dashboard');
    localStorage.setItem('ekinix_farmer_profile', JSON.stringify(fullProf));

    if (isNewUser) {
      setTimeout(() => {
        setOnboardingOpen(true);
      }, 300);
    }
  };

  const handleProfileSaved = (updatedProfile: FarmerProfile) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('ekinix_farmer_profile', JSON.stringify(updatedProfile));
  };

  const handleLogout = async () => {
    setUserProfile(null);
    localStorage.removeItem('ekinix_farmer_profile');
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
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        
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
              />
            </div>
          )}

          {/* TAB 4: CROP MARKETPLACE (DIRECT FARMER HARVEST LISTINGS) */}
          {activeTab === 'marketplace' && (
            <div className="animate-in fade-in duration-200">
              <MarketplaceSection
                currentLang={currentLang}
                userProfile={userProfile}
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
