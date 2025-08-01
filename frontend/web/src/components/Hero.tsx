'use client';

import { useState, useEffect } from 'react';
import { IoPhonePortrait, IoPlay, IoLeaf, IoRestaurant, IoTime, IoCamera, IoSparkles } from 'react-icons/io5';
import { colors } from '@/config/theme';
import Image from 'next/image';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" 
             style={{ background: `linear-gradient(135deg, ${colors.background.light} 0%, ${colors.primary[50]} 100%)` }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-8">
        <div className="absolute top-20 left-20 text-6xl" style={{ color: colors.primary[400] }}>
          <IoLeaf />
        </div>
        <div className="absolute top-40 right-32 text-4xl" style={{ color: colors.primary[300] }}>
          <IoRestaurant />
        </div>
        <div className="absolute bottom-32 left-16 text-5xl" style={{ color: colors.primary[500] }}>
          <IoLeaf />
        </div>
        <div className="absolute bottom-20 right-20 text-3xl" style={{ color: colors.primary[200] }}>
          <IoRestaurant />
        </div>
        <div className="absolute top-60 left-1/3 text-4xl" style={{ color: colors.primary[400] }}>
          <IoLeaf />
        </div>
        <div className="absolute top-32 right-1/4 text-5xl" style={{ color: colors.primary[300] }}>
          <IoRestaurant />
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div style={{ marginBottom: '2.5rem' }}>
              <h1 style={{ 
                fontSize: '3.75rem',
                fontWeight: '900',
                lineHeight: '1.25',
                letterSpacing: '-0.025em',
                color: colors.text.primary,
                fontFamily: '"Inter Display", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                marginBottom: '1.5rem'
              }}>
                Trasforma i tuoi
                <span className="block" style={{ 
                  color: colors.primary[500],
                  background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[600]})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ingredienti
                </span>
                in ricette deliziose
              </h1>
              <p style={{ 
                fontSize: '1.5rem',
                lineHeight: '1.625',
                color: colors.text.secondary,
                fontWeight: '500',
                maxWidth: '32rem'
              }}>
                Scansiona gli ingredienti nel tuo frigo e lascia che l&apos;AI di FridgeWiseAI 
                crei ricette personalizzate per te. Zero sprechi, massimo sapore.
              </p>
            </div>

            {/* Features Pills */}
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2"
                    style={{ 
                      backgroundColor: colors.background.surface + 'CC',
                      color: colors.text.secondary,
                      borderColor: colors.primary[200]
                    }}>
                <IoCamera style={{ color: colors.primary[500] }} />
                Scansione AI
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2"
                    style={{ 
                      backgroundColor: colors.background.surface + 'CC',
                      color: colors.text.secondary,
                      borderColor: colors.primary[200]
                    }}>
                <IoRestaurant style={{ color: colors.primary[500] }} />
                Ricette personalizzate
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2"
                    style={{ 
                      backgroundColor: colors.background.surface + 'CC',
                      color: colors.text.secondary,
                      borderColor: colors.primary[200]
                    }}>
                <IoTime style={{ color: colors.primary[500] }} />
                Gestione scadenze
              </span>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6" style={{ marginBottom: '2.5rem' }}>
              <button className="group relative px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-4 overflow-hidden"
                      style={{ 
                        backgroundColor: colors.primary[500],
                        color: colors.background.surface,
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: '700',
                        boxShadow: `
                          0 10px 40px -10px ${colors.primary[500]}60,
                          0 4px 6px -2px ${colors.primary[500]}30,
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary[600];
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        e.currentTarget.style.boxShadow = `
                          0 20px 60px -10px ${colors.primary[500]}70,
                          0 8px 16px -4px ${colors.primary[500]}40,
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                        `;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary[500];
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = `
                          0 10px 40px -10px ${colors.primary[500]}60,
                          0 4px 6px -2px ${colors.primary[500]}30,
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `;
                      }}>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                     style={{ background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[700]})` }}></div>
                
                <IoPhonePortrait className="text-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
                <span className="group-hover:tracking-wide transition-all duration-300">Scarica per iOS</span>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-1000 group-hover:translate-x-full"></div>
              </button>
              
              <button className="group relative border-2 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 flex items-center justify-center gap-4 overflow-hidden"
                      style={{ 
                        borderColor: colors.primary[500],
                        color: colors.primary[500],
                        backgroundColor: 'transparent',
                        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontWeight: '700'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary[500];
                        e.currentTarget.style.color = colors.background.surface;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `
                          0 10px 40px -10px ${colors.primary[500]}40,
                          0 4px 6px -2px ${colors.primary[500]}20
                        `;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = colors.primary[500];
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                {/* Animated background */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ backgroundColor: colors.primary[500] }}></div>
                
                <IoPlay className="text-2xl group-hover:scale-110 transition-transform duration-300 relative z-10" />
                <span className="group-hover:tracking-wide transition-all duration-300 relative z-10">Guarda il video</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t" style={{ borderColor: colors.primary[200] }}>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: colors.primary[500] }}>10k+</div>
                <div className="text-sm" style={{ color: colors.text.secondary }}>Ricette generate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: colors.primary[500] }}>95%</div>
                <div className="text-sm" style={{ color: colors.text.secondary }}>Meno sprechi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: colors.primary[500] }}>4.8★</div>
                <div className="text-sm" style={{ color: colors.text.secondary }}>Rating utenti</div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative mx-auto w-80 h-[700px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl">
                <div className="absolute inset-2 bg-black rounded-[2.5rem] overflow-hidden">
                  {/* Screen Content */}
                  <div className="relative w-full h-full overflow-hidden">
                    {/* Real HomeScreen Screenshot in Hero - Full Screen */}
                    <div className="w-full h-full relative">
                      <Image 
                        src="/assets/screenshots_ita/home.png"
                        alt="FridgeWiseAI Home Screen"
                        fill
                        className="object-cover object-top"
                        style={{ 
                          objectFit: 'cover',
                          objectPosition: 'top center'
                        }}
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 rounded-full p-3 shadow-lg animate-bounce"
                   style={{ backgroundColor: colors.background.surface }}>
                <IoSparkles className="text-2xl" style={{ color: colors.primary[500] }} />
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-full p-3 shadow-lg animate-pulse"
                   style={{ backgroundColor: colors.background.surface }}>
                <IoRestaurant className="text-2xl" style={{ color: colors.primary[500] }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}