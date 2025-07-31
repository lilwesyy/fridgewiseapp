'use client';

import { useState, useEffect } from 'react';
import { IoPhonePortrait, IoPlay, IoLeaf, IoRestaurant, IoTime, IoCamera, IoSparkles } from 'react-icons/io5';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-green-50 to-green-100 min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 text-6xl text-green-500">
          <IoLeaf />
        </div>
        <div className="absolute top-40 right-32 text-4xl text-green-400">
          <IoRestaurant />
        </div>
        <div className="absolute bottom-32 left-16 text-5xl text-green-600">
          <IoLeaf />
        </div>
        <div className="absolute bottom-20 right-20 text-3xl text-green-300">
          <IoRestaurant />
        </div>
        <div className="absolute top-60 left-1/3 text-4xl text-green-500">
          <IoLeaf />
        </div>
        <div className="absolute top-32 right-1/4 text-5xl text-green-400">
          <IoRestaurant />
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Trasforma i tuoi
                <span className="text-green-600 block">ingredienti</span>
                in ricette deliziose
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Scansiona gli ingredienti nel tuo frigo e lascia che l&apos;AI di FridgeWise 
                crei ricette personalizzate per te. Zero sprechi, massimo sapore.
              </p>
            </div>

            {/* Features Pills */}
            <div className="flex flex-wrap gap-3">
              <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-green-200 flex items-center gap-2">
                <IoCamera className="text-green-600" />
                Scansione AI
              </span>
              <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-green-200 flex items-center gap-2">
                <IoRestaurant className="text-green-600" />
                Ricette personalizzate
              </span>
              <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 border border-green-200 flex items-center gap-2">
                <IoTime className="text-green-600" />
                Gestione scadenze
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                <IoPhonePortrait className="text-xl" />
                Scarica per iOS
              </button>
              <button className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3">
                <IoPlay className="text-xl" />
                Guarda il video
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-green-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">10k+</div>
                <div className="text-sm text-gray-600">Ricette generate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Meno sprechi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">4.8★</div>
                <div className="text-sm text-gray-600">Rating utenti</div>
              </div>
            </div>
          </div>

          {/* Right Content - Phone Mockup */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative mx-auto w-80 h-[600px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl">
                <div className="absolute inset-2 bg-black rounded-[2.5rem] overflow-hidden">
                  {/* Screen Content */}
                  <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-white">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center px-6 py-3 text-xs font-medium">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-2 bg-green-500 rounded-sm"></div>
                        <span>100%</span>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="px-4 py-2">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">FridgeWise</h3>
                        <p className="text-sm text-gray-600">Scansiona i tuoi ingredienti</p>
                      </div>
                      
                      {/* Camera View Mockup */}
                      <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center mb-4 relative overflow-hidden">
                        <div className="text-4xl">📷</div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                            <div className="text-xs text-gray-700">Ingredienti rilevati:</div>
                            <div className="flex gap-1 mt-1">
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">🍅 Pomodori</span>
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">🧄 Aglio</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
                        Genera Ricette
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg animate-bounce">
                <IoSparkles className="text-2xl text-green-600" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg animate-pulse">
                <IoRestaurant className="text-2xl text-green-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}