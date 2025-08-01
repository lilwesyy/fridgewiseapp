'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoMenu, IoClose, IoPhonePortrait, IoPlay, IoLogOut } from 'react-icons/io5';
import { useMaintenance } from '@/hooks/useMaintenance';
import { colors } from '@/config/theme';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useMaintenance();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'backdrop-blur-md shadow-lg' 
        : ''
    }`}
         style={{
           backgroundColor: isScrolled 
             ? colors.background.surface + 'F2' 
             : 'transparent'
         }}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/assets/logo.svg"
                alt="FridgeWiseAI Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl lg:text-2xl font-bold" style={{ color: colors.text.primary }}>
              FridgeWiseAI
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {[
              { id: 'features', label: 'Funzionalità' },
              { id: 'how-it-works', label: 'Come Funziona' },
              { id: 'screenshots', label: 'App' },
              { id: 'download', label: 'Download' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="relative px-4 py-2 font-semibold text-lg transition-all duration-300 group overflow-hidden rounded-lg"
                style={{ color: colors.text.secondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.primary[600];
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.text.secondary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">
                  {item.label}
                </span>
                {/* Animated underline */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                     style={{ backgroundColor: colors.primary[500] }}></div>
                {/* Hover background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"
                     style={{ backgroundColor: colors.primary[100] }}></div>
              </button>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="group flex items-center gap-2 px-4 py-2 font-semibold text-lg transition-all duration-300 relative overflow-hidden rounded-lg"
                    style={{ color: colors.text.secondary }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = colors.primary[600];
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = colors.text.secondary;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}>
              <IoPlay className="text-xl group-hover:scale-110 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-all duration-300">Demo</span>
              {/* Hover background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"
                   style={{ backgroundColor: colors.primary[100] }}></div>
            </button>
            
            <button className="group flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                    style={{ 
                      backgroundColor: colors.primary[500], 
                      color: colors.background.surface,
                      boxShadow: `
                        0 4px 15px -3px ${colors.primary[500]}40,
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                      `
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary[600];
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                      e.currentTarget.style.boxShadow = `
                        0 8px 25px -5px ${colors.primary[500]}50,
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                      `;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary[500];
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `
                        0 4px 15px -3px ${colors.primary[500]}40,
                        inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                      `;
                    }}>
              <IoPhonePortrait className="text-xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-all duration-300">Scarica App</span>
              {/* Button shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full"></div>
            </button>
            
            <button 
              onClick={logout}
              className="group flex items-center gap-2 px-4 py-2 font-semibold transition-all duration-300 rounded-lg relative overflow-hidden"
              style={{ color: '#DC2626' }}
              title="Logout (torna alla manutenzione)"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#B91C1C';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#DC2626';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <IoLogOut className="text-xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              <span className="group-hover:tracking-wide transition-all duration-300">Logout</span>
              {/* Hover background */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"
                   style={{ backgroundColor: '#FCA5A5' }}></div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-green-600 transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <IoClose className="text-2xl" />
            ) : (
              <IoMenu className="text-2xl" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen 
            ? 'max-h-96 opacity-100' 
            : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-4 border-t border-gray-200 bg-white/95 backdrop-blur-md rounded-b-2xl">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all duration-300"
            >
              Funzionalità
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all duration-300"
            >
              Come Funziona
            </button>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all duration-300"
            >
              App
            </button>
            <button
              onClick={() => scrollToSection('download')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg font-medium transition-all duration-300"
            >
              Download
            </button>
            
            <div className="px-4 pt-4 space-y-3 border-t border-gray-200">
              <button className="flex items-center gap-2 w-full justify-center text-gray-700 hover:text-green-600 font-medium py-2 transition-colors duration-300">
                <IoPlay className="text-lg" />
                Guarda Demo
              </button>
              <button className="flex items-center gap-2 w-full justify-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                <IoPhonePortrait className="text-lg" />
                Scarica App
              </button>
              <button 
                onClick={logout}
                className="flex items-center gap-2 w-full justify-center text-red-600 hover:text-red-700 font-medium py-2 transition-colors duration-300"
              >
                <IoLogOut className="text-lg" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}