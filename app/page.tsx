'use client';

import React, { useState, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { InteractiveDemo } from '@/components/InteractiveDemo';
import { MyFieldsSection } from '@/components/MyFieldsSection';
import { CropGuideSection } from '@/components/CropGuideSection';
import { MarketplaceSection } from '@/components/MarketplaceSection';
import { FarmerDashboardSection } from '@/components/FarmerDashboardSection';
import { AuthModal } from '@/components/AuthModal';
import { FarmerOnboardingModal } from '@/components/FarmerOnboardingModal';
import { SettingsModal } from '@/components/SettingsModal';
import { SupabaseSetupModal } from '@/components/SupabaseSetupModal';
import { Footer } from '@/components/Footer';
import { FarmerProfile, isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function Home() {
  const [currentLang, setCurrentLang] = useState<Language>('uz');
  const [activeNavSection, setActiveNavSection] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dbModalOpen, setDbModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<FarmerProfile | null>(null);

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

          // Try fetching from public.farmers table
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

    // Open onboarding flow for new users or if requested
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

  const handleExploreClick = () => {
    setActiveNavSection('fields');
    const el = document.getElementById('section-[#interactive-demo]') || document.querySelector('section[id*="interactive"]');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 800, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#1A281E]">
      
      {/* Header with Nav, Language Toggle & Auth */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onOpenAuth={handleOpenAuth}
        onOpenDbModal={() => setDbModalOpen(true)}
        activeNavSection={activeNavSection}
        setActiveNavSection={setActiveNavSection}
        userProfile={userProfile}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          currentLang={currentLang}
          onOpenRegister={() => handleOpenAuth('register')}
          onExploreClick={handleExploreClick}
        />

        {/* 3-Step "How It Works" Section */}
        <HowItWorks
          currentLang={currentLang}
          onOpenRegister={() => handleOpenAuth('register')}
        />

        {/* Farmer Dashboard Page/Section */}
        <FarmerDashboardSection
          currentLang={currentLang}
          userProfile={userProfile}
          onOpenAuth={handleOpenAuth}
          onNavigateToFields={() => {
            const el = document.getElementById('my-fields');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* My Fields Section with Leaflet Map Drawing & Supabase Storage */}
        <MyFieldsSection
          currentLang={currentLang}
          userProfile={userProfile}
          onOpenAuth={handleOpenAuth}
        />

        {/* Structured Crop Guides & Growth Stages Section */}
        <CropGuideSection
          currentLang={currentLang}
        />

        {/* Ekinix Agricultural Produce Marketplace Section */}
        <MarketplaceSection
          currentLang={currentLang}
          userProfile={userProfile}
        />

        {/* Live Interactive Feature Demo (Satellite, Weather/Irrigation, Marketplace, Guides) */}
        <InteractiveDemo
          currentLang={currentLang}
          onOpenAuth={handleOpenAuth}
        />
      </main>

      {/* Footer */}
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

      {/* Farmer Onboarding 3-Step Wizard Modal */}
      <FarmerOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        currentLang={currentLang}
        initialProfile={userProfile}
        onProfileSaved={handleProfileSaved}
        userId={userProfile?.user_id}
        userPhone={userProfile?.phone}
      />

      {/* Settings & Notification Preferences Modal */}
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

      {/* Supabase Database Setup & SQL Modal */}
      <SupabaseSetupModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />

    </div>
  );
}

