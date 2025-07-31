'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IoMenu, IoClose, IoPhonePortrait, IoPlay, IoLogOut } from 'react-icons/io5';
import { useMaintenance } from '@/hooks/useMaintenance';

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
        ? 'bg-white/95 backdrop-blur-md shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/assets/logo.svg"
                alt="FridgeWise Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl lg:text-2xl font-bold text-gray-900">
              FridgeWise
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
            >
              Funzionalità
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
            >
              Come Funziona
            </button>
            <button
              onClick={() => scrollToSection('screenshots')}
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
            >
              App
            </button>
            <button
              onClick={() => scrollToSection('download')}
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-300"
            >
              Download
            </button>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="flex items-center gap-2 text-gray-700 hover:text-green-600 font-medium transition-colors duration-300">
              <IoPlay className="text-lg" />
              Demo
            </button>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105">
              <IoPhonePortrait className="text-lg" />
              Scarica App
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors duration-300"
              title="Logout (torna alla manutenzione)"
            >
              <IoLogOut className="text-lg" />
              Logout
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