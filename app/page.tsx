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
import { WeatherIrrigationSection } from '@/components/WeatherIrrigationSection';
import { MarketplaceSection } from '@/components/MarketplaceSection';
import { CropGuideSection } from '@/components/CropGuideSection';
import { AuthModal } from '@/components/AuthModal';
import { FarmerOnboardingModal } from '@/components/FarmerOnboardingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { SupabaseSetupModal } from '@/components/SupabaseSetupModal';
import { Footer } from '@/components/Footer';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function Home() {
  const [currentLang, setCurrentLang] = useState<Language>('uz');
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dbModalOpen, setDbModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
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

  // Listen for custom tab switch events from inner components
  useEffect(() => {
    const handleSwitchTabEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetTab = customEvent.detail;
      if (['overview', 'dashboard', 'fields', 'weather', 'marketplace', 'guides'].includes(targetTab)) {
        setActiveTab(targetTab as NavTabId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('ekinix-switch-tab', handleSwitchTabEvent);
    return () => window.removeEventListener('ekinix-switch-tab', handleSwitchTabEvent);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register') => {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#1A281E]">
      
      {/* 1. MINIMAL GOOGLE WORKSPACE / AI STUDIO HEADER */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        userProfile={userProfile}
        onOpenAuth={handleOpenAuth}
        onOpenDbModal={() => setDbModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 2. COLLAPSIBLE SLIDE-OUT SIDEBAR DRAWER */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeTab={activeTab}
        onTabChange={handleTabSelect}
        userProfile={userProfile}
        onOpenAuth={handleOpenAuth}
        onOpenDbModal={() => setDbModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onLogout={handleLogout}
      />

      {/* 3. MAIN WORKSPACE CONTAINER (Active Tool / Page Only) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* TAB 1: OVERVIEW / PLATFORM INTRODUCTION */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <Hero
              currentLang={currentLang}
              onOpenRegister={() => handleOpenAuth('register')}
              onExploreClick={() => handleTabSelect('fields')}
            />
            <HowItWorks
              currentLang={currentLang}
              onOpenRegister={() => handleOpenAuth('register')}
            />
            <InteractiveDemo
              currentLang={currentLang}
              onOpenAuth={handleOpenAuth}
            />
          </div>
        )}

        {/* TAB 2: FARMER DASHBOARD (NDVI TELEMETRY & FIELD SENSORS) */}
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

        {/* TAB 3: MY FIELDS (LEAFLET INTERACTIVE POLYGON DRAWER & REGISTRATION) */}
        {activeTab === 'fields' && (
          <div className="animate-in fade-in duration-200">
            <MyFieldsSection
              currentLang={currentLang}
              userProfile={userProfile}
              onOpenAuth={handleOpenAuth}
            />
          </div>
        )}

        {/* TAB 4: WEATHER & PRECISION IRRIGATION (OPEN-METEO 7-DAY FORECAST & MODEL) */}
        {activeTab === 'weather' && (
          <div className="animate-in fade-in duration-200">
            <WeatherIrrigationSection
              currentLang={currentLang}
            />
          </div>
        )}

        {/* TAB 5: CROP MARKETPLACE (DIRECT FARMER HARVEST LISTINGS) */}
        {activeTab === 'marketplace' && (
          <div className="animate-in fade-in duration-200">
            <MarketplaceSection
              currentLang={currentLang}
              userProfile={userProfile}
            />
          </div>
        )}

        {/* TAB 6: CROP AGRONOMY GUIDES (GROWTH STAGES & BEST PRACTICES) */}
        {activeTab === 'guides' && (
          <div className="animate-in fade-in duration-200">
            <CropGuideSection
              currentLang={currentLang}
            />
          </div>
        )}

      </main>

      {/* 4. GLOBAL FOOTER */}
      <Footer
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenDbModal={() => setDbModalOpen(true)}
      />

      {/* MODALS */}
      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
        currentLang={currentLang}
        onAuthSuccess={handleAuthSuccess}
      />

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

      {/* Supabase Database Schema & Setup Modal */}
      <SupabaseSetupModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />

    </div>
  );
}
