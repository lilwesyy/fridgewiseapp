'use client';

import { colors } from '@/config/theme';
import PrivacyPolicyModal from '@/components/modals/PrivacyPolicyModal';
import TermsOfServiceModal from '@/components/modals/TermsOfServiceModal';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LogoImage from '@/components/LogoImage';

export default function Home() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { t, isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent absolute top-0 left-0" style={{ borderTopColor: colors.primary[500] }}></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center gap-2 sm:gap-3">
              <LogoImage className="w-7 h-7 sm:w-8 sm:h-8" priority />
              <span className="text-lg sm:text-xl font-semibold text-gray-900">FridgeWiseAI</span>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('maintenance_authenticated');
                  window.location.reload();
                }}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer"
              >
                {t.logout}
              </button>
              <button 
                className="text-white px-6 py-2 rounded-full font-medium text-sm transition-colors hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: colors.primary[500] }}
              >
                {t.download}
              </button>
            </div>

            {/* Mobile Actions - Simplified */}
            <div className="flex sm:hidden items-center gap-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('maintenance_authenticated');
                  window.location.reload();
                }}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                title={t.logout}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
              <button 
                className="text-white px-3 py-2 rounded-full font-medium text-xs transition-colors hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: colors.primary[500] }}
              >
                {t.download}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8" style={{ backgroundColor: colors.primary[50], color: colors.primary[600] }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary[500] }}></div>
            {t.hero.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8">
            {t.hero.title}
            <span className="block" style={{ color: colors.primary[500] }}>{t.hero.titleHighlight}</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            {t.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              className="text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: colors.primary[500] }}
            >
              {t.hero.downloadFree}
            </button>
            <button className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all cursor-pointer">
              {t.hero.watchDemo}
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★★★★★</span>
              <span>{t.stats.rating}</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <span>{t.stats.downloads}</span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span>{t.stats.free}</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.features.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8" style={{ color: colors.primary[500] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.features.visualRecognition.title}</h3>
              <p className="text-gray-600 leading-relaxed">{t.features.visualRecognition.description}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.features.smartRecipes.title}</h3>
              <p className="text-gray-600 leading-relaxed">{t.features.smartRecipes.description}</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{t.features.wasteManagement.title}</h3>
              <p className="text-gray-600 leading-relaxed">{t.features.wasteManagement.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl text-gray-600 font-light">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="space-y-16">
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary[500] }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-light text-gray-300">01</span>
                  <h3 className="text-2xl font-semibold text-gray-900">{t.howItWorks.step1.title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed font-light">{t.howItWorks.step1.description}</p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary[500] }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-light text-gray-300">02</span>
                  <h3 className="text-2xl font-semibold text-gray-900">{t.howItWorks.step2.title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed font-light">{t.howItWorks.step2.description}</p>
              </div>
            </div>

            <div className="flex items-start gap-8">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: colors.primary[500] }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-light text-gray-300">03</span>
                  <h3 className="text-2xl font-semibold text-gray-900">{t.howItWorks.step3.title}</h3>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed font-light">{t.howItWorks.step3.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32" style={{ backgroundColor: colors.primary[500] }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            {t.results.title}
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="font-light" style={{ color: colors.primary[100] }}>{t.results.accuracy}</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
              <div className="font-light" style={{ color: colors.primary[100] }}>{t.results.recipes}</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">60%</div>
              <div className="font-light" style={{ color: colors.primary[100] }}>{t.results.wasteReduction}</div>
            </div>
            <div className="text-white">
              <div className="text-4xl md:text-5xl font-bold mb-2">4.9★</div>
              <div className="font-light" style={{ color: colors.primary[100] }}>{t.results.rating}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.testimonials.title}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 font-light italic">
                &ldquo;{t.testimonials.reviews.elena.content}&rdquo;
              </p>
              <div>
                <div className="font-semibold text-gray-900">{t.testimonials.reviews.elena.name}</div>
                <div className="text-gray-500 text-sm">{t.testimonials.reviews.elena.role}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 font-light italic">
                &ldquo;{t.testimonials.reviews.marco.content}&rdquo;
              </p>
              <div>
                <div className="font-semibold text-gray-900">{t.testimonials.reviews.marco.name}</div>
                <div className="text-gray-500 text-sm">{t.testimonials.reviews.marco.role}</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed mb-6 font-light italic">
                &ldquo;{t.testimonials.reviews.sofia.content}&rdquo;
              </p>
              <div>
                <div className="font-semibold text-gray-900">{t.testimonials.reviews.sofia.name}</div>
                <div className="text-gray-500 text-sm">{t.testimonials.reviews.sofia.role}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
            {t.finalCta.title}
          </h2>
          <p className="text-xl text-gray-600 mb-12 font-light">
            {t.finalCta.subtitle}
          </p>
          
          <div className="flex justify-center mb-12">
            <button className="bg-black hover:bg-gray-800 text-white px-10 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.64c.87-1.47 2.41-2.4 4.05-2.4 1.34-.04 2.6.87 3.43.87.8 0 2.34-1.04 3.95-.88.67.03 2.56.27 3.77 2.05.1.16-.65.38-.66 1.01-.03.59.52 1.18.52 1.18-.33.47-.65 1.25-.65 2.05 0 .83.39 1.59.68 2.09z"/>
                <path d="M15.94 6.07c-.33 1.28-1.23 2.27-2.17 2.27-.09-1.28.35-2.61 1.04-3.47.69-.87 1.9-1.49 2.81-1.49.09 1.37-.25 2.71-.68 3.69z"/>
              </svg>
              {t.finalCta.downloadButton}
            </button>
          </div>

          <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
            <span>✓ {t.finalCta.features.free}</span>
            <span>✓ {t.finalCta.features.noSubscription}</span>
            <span>✓ {t.finalCta.features.privacy}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-8 md:mb-0">
              <LogoImage className="w-8 h-8" />
              <span className="text-xl font-semibold text-gray-900">FridgeWiseAI</span>
            </div>
            
            <div className="flex items-center gap-8 text-gray-500 text-sm">
              <button 
                onClick={() => setShowPrivacyModal(true)}
                className="hover:text-gray-900 transition-colors cursor-pointer"
              >
                {t.footer.privacy}
              </button>
              <button 
                onClick={() => setShowTermsModal(true)}
                className="hover:text-gray-900 transition-colors cursor-pointer"
              >
                {t.footer.terms}
              </button>
              <a href="mailto:support@fridgewiseai.com" className="hover:text-gray-900 transition-colors">{t.footer.support}</a>
              <span>{t.footer.copyright}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
      />
      <TermsOfServiceModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </main>
  );
}