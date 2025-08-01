'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoRestaurant, IoList, IoSnow, IoHeart, IoCamera, IoAdd, IoTime } from 'react-icons/io5';
import { colors } from '@/config/theme';
import Image from 'next/image';

const screenshots = [
  {
    id: 1,
    title: 'Scansione Ingredienti',
    description: 'Riconosci automaticamente gli ingredienti con la fotocamera AI',
    image: '/screenshots/scan.jpg', // Placeholder
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 2,
    title: 'Ricette Personalizzate',
    description: 'Genera ricette uniche basate sui tuoi ingredienti disponibili',
    image: '/screenshots/recipes.jpg', // Placeholder
    color: 'from-green-500 to-green-600'
  },
  {
    id: 3,
    title: 'Istruzioni Dettagliate',
    description: 'Segui passo dopo passo le istruzioni per cucinare perfettamente',
    image: '/screenshots/cooking.jpg', // Placeholder
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 4,
    title: 'Gestione Frigo',
    description: 'Monitora le scadenze e organizza i tuoi ingredienti',
    image: '/screenshots/fridge.jpg', // Placeholder
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 5,
    title: 'Ricette Salvate',
    description: 'Salva le tue ricette preferite e accedi rapidamente',
    image: '/screenshots/saved.jpg', // Placeholder
    color: 'from-red-500 to-red-600'
  }
];

export default function Screenshots() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveIndex(prev => (prev + 1) % screenshots.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Scopri l&apos;interfaccia
            <span className="text-green-600 block">intuitiva</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Un design pensato per rendere la cucina più semplice e divertente
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Phone Display */}
          <div className={`relative transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <div className="relative mx-auto w-96 h-[800px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl">
                <div className="absolute inset-3 bg-black rounded-[2.5rem] overflow-hidden">
                  {/* Screen Content */}
                  <div className="relative w-full h-full">
                    {/* Dynamic Content - Full Screen */}
                    <div className="w-full h-full">
                      {activeIndex === 0 && (
                        <div className="h-full overflow-hidden relative">
                          {/* Real HomeScreen Screenshot */}
                          <Image 
                            src="/assets/screenshots_ita/home.png"
                            alt="FridgeWiseAI Home Screen"
                            fill
                            className="object-cover object-top"
                            style={{ 
                              objectFit: 'cover',
                              objectPosition: 'top center'
                            }}
                          />
                        </div>
                      )}

                      {activeIndex === 1 && (
                        <div className="h-full px-5 py-4" style={{ backgroundColor: colors.background.light }}>
                          {/* Faithful FeaturesOverview Replica */}
                          
                          {/* Section Title */}
                          <div className="mb-4">
                            <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Cosa Puoi Fare</h2>
                          </div>
                          
                          {/* Features Grid - 2x2 layout exactly like mobile */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* Feature 1: AI Recognition */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="mb-3 p-3 rounded-xl self-start" style={{ backgroundColor: colors.background.light }}>
                                <IoCamera className="text-2xl" style={{ color: colors.primary[500] }} />
                              </div>
                              <h3 className="font-bold text-base mb-2" style={{ color: colors.text.primary }}>Riconoscimento IA</h3>
                              <p className="text-sm leading-5" style={{ color: colors.text.secondary }}>
                                Rilevamento avanzato degli ingredienti con intelligenza artificiale
                              </p>
                            </div>

                            {/* Feature 2: Smart Recipes */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="mb-3 p-3 rounded-xl self-start" style={{ backgroundColor: colors.background.light }}>
                                <IoRestaurant className="text-2xl" style={{ color: '#10B981' }} />
                              </div>
                              <h3 className="font-bold text-base mb-2" style={{ color: colors.text.primary }}>Ricette Intelligenti</h3>
                              <p className="text-sm leading-5" style={{ color: colors.text.secondary }}>
                                Ricette personalizzate basate sui tuoi ingredienti disponibili
                              </p>
                            </div>

                            {/* Feature 3: Save Recipes */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="mb-3 p-3 rounded-xl self-start" style={{ backgroundColor: colors.background.light }}>
                                <IoHeart className="text-2xl" style={{ color: '#F59E0B' }} />
                              </div>
                              <h3 className="font-bold text-base mb-2" style={{ color: colors.text.primary }}>Salva Preferite</h3>
                              <p className="text-sm leading-5" style={{ color: colors.text.secondary }}>
                                Conserva le tue ricette preferite per un accesso rapido
                              </p>
                            </div>

                            {/* Feature 4: Personal Experience */}
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="mb-3 p-3 rounded-xl self-start" style={{ backgroundColor: colors.background.light }}>
                                <IoPhonePortrait className="text-2xl" style={{ color: colors.primary[500] }} />
                              </div>
                              <h3 className="font-bold text-base mb-2" style={{ color: colors.text.primary }}>Profilo Personale</h3>
                              <p className="text-sm leading-5" style={{ color: colors.text.secondary }}>
                                Personalizza le tue preferenze e restrizioni dietetiche
                              </p>
                            </div>
                          </div>

                          {/* Tips Section */}
                          <div className="mt-6">
                            <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>Consiglio</h2>
                            
                            <div className="bg-white rounded-xl p-4 flex items-center shadow-sm">
                              <div className="mr-4 p-3 rounded-xl" style={{ backgroundColor: colors.background.light }}>
                                <span className="text-2xl">💡</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-base mb-1" style={{ color: colors.text.primary }}>Migliori Risultati</h3>
                                <p className="text-sm leading-5" style={{ color: colors.text.secondary }}>
                                  Per un migliore riconoscimento degli ingredienti, assicurati di avere buona illuminazione e visibilità degli oggetti
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeIndex === 2 && (
                        <div className="h-full px-5 py-4" style={{ backgroundColor: colors.background.light }}>
                          {/* Header with back button and title */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <span className="text-lg" style={{ color: colors.text.primary }}>←</span>
                            </div>
                            <h1 className="text-xl font-bold" style={{ color: colors.text.primary }}>Ricette per Te</h1>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <IoRestaurant className="text-lg" style={{ color: colors.primary[500] }} />
                            </div>
                          </div>

                          {/* Search/Filter Bar */}
                          <div className="mb-4">
                            <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
                              <div className="text-gray-400">🔍</div>
                              <span className="text-sm" style={{ color: colors.text.secondary }}>Cerca ricette...</span>
                              <div className="ml-auto flex gap-2">
                                <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                                  <span className="text-xs text-green-600">V</span>
                                </div>
                                <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                                  <span className="text-xs text-orange-600">G</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Available Ingredients Summary */}
                          <div className="mb-4">
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <h3 className="font-bold text-sm mb-2" style={{ color: colors.text.primary }}>Ingredienti Disponibili</h3>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 rounded-full text-xs text-green-700" style={{ backgroundColor: '#E8F5E8' }}>🍅 Pomodori</span>
                                <span className="px-2 py-1 rounded-full text-xs text-green-700" style={{ backgroundColor: '#E8F5E8' }}>🌿 Basilico</span>
                                <span className="px-2 py-1 rounded-full text-xs text-blue-700" style={{ backgroundColor: '#E8F2FF' }}>🧀 Mozzarella</span>
                                <span className="px-2 py-1 rounded-full text-xs text-gray-600" style={{ backgroundColor: colors.background.light }}>+4 altri</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Recipe List */}
                          <div className="space-y-3 flex-1">
                            {[
                              { name: 'Caprese Fresca', time: '5 min', difficulty: 'Facile', rating: '4.9', match: '98%', image: '🥗', ingredients: 3 },
                              { name: 'Bruschetta al Pomodoro', time: '10 min', difficulty: 'Facile', rating: '4.8', match: '95%', image: '🍞', ingredients: 4 },
                              { name: 'Insalata Mediterranea', time: '8 min', difficulty: 'Facile', rating: '4.7', match: '92%', image: '🥙', ingredients: 5 },
                            ].map((recipe, i) => (
                              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: colors.background.light }}>
                                    {recipe.image}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-base mb-1" style={{ color: colors.text.primary }}>{recipe.name}</h4>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs flex items-center gap-1" style={{ color: colors.text.secondary }}>
                                        <IoTime className="text-gray-400" />
                                        {recipe.time}
                                      </span>
                                      <span className="text-xs" style={{ color: colors.text.secondary }}>{recipe.difficulty}</span>
                                      <span className="text-xs" style={{ color: colors.text.secondary }}>{recipe.ingredients} ingredienti</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-500 font-bold text-sm mb-1">★ {recipe.rating}</div>
                                    <div className="text-xs font-medium" style={{ color: colors.primary[500] }}>{recipe.match} match</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Action */}
                          <div className="mt-4">
                            <button 
                              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                              style={{ backgroundColor: colors.primary[500] }}
                            >
                              <IoAdd className="text-white" />
                              Genera Nuove Ricette
                            </button>
                          </div>
                        </div>
                      )}

                      {activeIndex === 3 && (
                        <div className="h-full px-5 py-4" style={{ backgroundColor: colors.background.light }}>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <span className="text-lg" style={{ color: colors.text.primary }}>←</span>
                            </div>
                            <h1 className="text-xl font-bold" style={{ color: colors.text.primary }}>Il Mio Frigo</h1>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <IoAdd className="text-lg" style={{ color: colors.primary[500] }} />
                            </div>
                          </div>

                          {/* Stats Cards */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>12</p>
                                  <p className="text-xs" style={{ color: colors.text.secondary }}>Ingredienti</p>
                                </div>
                                <div className="text-2xl">🥬</div>
                              </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-2xl font-bold text-orange-600">3</p>
                                  <p className="text-xs" style={{ color: colors.text.secondary }}>In Scadenza</p>
                                </div>
                                <div className="text-2xl">⚠️</div>
                              </div>
                            </div>
                          </div>

                          {/* Category Tabs */}
                          <div className="flex gap-2 mb-4">
                            {['Tutti', 'Fresco', 'Latticini', 'Conserve'].map((tab, i) => (
                              <button 
                                key={tab}
                                className={`px-3 py-2 rounded-full text-xs font-medium ${
                                  i === 0 
                                    ? 'text-white' 
                                    : 'bg-white text-gray-600'
                                }`}
                                style={i === 0 ? { backgroundColor: colors.primary[500] } : {}}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>

                          {/* Items List */}
                          <div className="space-y-3 flex-1">
                            {[
                              { name: 'Pomodori Cherry', category: 'Fresco', days: 3, quantity: '250g', emoji: '🍅', color: 'green' },
                              { name: 'Latte Intero', category: 'Latticini', days: 1, quantity: '1L', emoji: '🥛', color: 'orange' },
                              { name: 'Yogurt Greco', category: 'Latticini', days: 0, quantity: '150g', emoji: '🥛', color: 'red' },
                              { name: 'Basilico Fresco', category: 'Fresco', days: 2, quantity: '50g', emoji: '🌿', color: 'orange' },
                              { name: 'Mozzarella', category: 'Latticini', days: 5, quantity: '125g', emoji: '🧀', color: 'green' },
                            ].map((item, i) => (
                              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: colors.background.light }}>
                                    {item.emoji}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-base" style={{ color: colors.text.primary }}>{item.name}</h4>
                                    <p className="text-xs" style={{ color: colors.text.secondary }}>
                                      {item.category} • {item.quantity}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.color === 'green' ? 'bg-green-100 text-green-700' : 
                                      item.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {item.days === 0 ? 'Scade oggi' : `${item.days}g rimanenti`}
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: colors.text.secondary }}>
                                      {item.days === 0 ? '⚠️ Urgente' : `${item.days} giorni`}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Action */}
                          <div className="mt-4">
                            <button 
                              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                              style={{ backgroundColor: colors.primary[500] }}
                            >
                              <IoCamera className="text-white" />
                              Scansiona Nuovi Ingredienti
                            </button>
                          </div>
                        </div>
                      )}

                      {activeIndex === 4 && (
                        <div className="h-full px-5 py-4" style={{ backgroundColor: colors.background.light }}>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <span className="text-lg" style={{ color: colors.text.primary }}>←</span>
                            </div>
                            <h1 className="text-xl font-bold" style={{ color: colors.text.primary }}>Ricette Salvate</h1>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                              <span className="text-lg">🔍</span>
                            </div>
                          </div>

                          {/* Quick Stats */}
                          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="text-center flex-1">
                                <p className="text-2xl font-bold" style={{ color: colors.primary[500] }}>24</p>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>Salvate</p>
                              </div>
                              <div className="w-px h-8 bg-gray-200"></div>
                              <div className="text-center flex-1">
                                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>12</p>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>Cucinate</p>
                              </div>
                              <div className="w-px h-8 bg-gray-200"></div>
                              <div className="text-center flex-1">
                                <p className="text-2xl font-bold text-yellow-600">4.8</p>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>Rating</p>
                              </div>
                            </div>
                          </div>

                          {/* Categories */}
                          <div className="flex gap-2 mb-4">
                            {['Tutte', 'Primi', 'Secondi', 'Dolci'].map((tab, i) => (
                              <button 
                                key={tab}
                                className={`px-3 py-2 rounded-full text-xs font-medium ${
                                  i === 0 
                                    ? 'text-white' 
                                    : 'bg-white text-gray-600'
                                }`}
                                style={i === 0 ? { backgroundColor: colors.primary[500] } : {}}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>

                          {/* Saved Recipes List */}
                          <div className="space-y-3 flex-1">
                            {[
                              { name: 'Spaghetti Carbonara', category: 'Primi', time: '20 min', rating: 4.9, cooked: 3, image: '🍝', difficulty: 'Medio' },
                              { name: 'Risotto ai Funghi', category: 'Primi', time: '35 min', rating: 4.7, cooked: 2, image: '🍚', difficulty: 'Difficile' },
                              { name: 'Tiramisù Classico', category: 'Dolci', time: '45 min', rating: 4.8, cooked: 1, image: '🍰', difficulty: 'Medio' },
                              { name: 'Pollo alla Cacciatora', category: 'Secondi', time: '50 min', rating: 4.6, cooked: 2, image: '🍗', difficulty: 'Medio' },
                            ].map((recipe, i) => (
                              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: colors.background.light }}>
                                    {recipe.image}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-bold text-base" style={{ color: colors.text.primary }}>{recipe.name}</h4>
                                      <IoHeart className="text-red-500 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs flex items-center gap-1" style={{ color: colors.text.secondary }}>
                                        <IoTime className="text-gray-400" />
                                        {recipe.time}
                                      </span>
                                      <span className="text-xs" style={{ color: colors.text.secondary }}>{recipe.difficulty}</span>
                                      <span className="text-xs" style={{ color: colors.text.secondary }}>Cucinato {recipe.cooked}x</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-500 font-bold text-sm mb-1">★ {recipe.rating}</div>
                                    <div className="text-xs" style={{ color: colors.text.secondary }}>{recipe.category}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bottom Action */}
                          <div className="mt-4">
                            <button 
                              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                              style={{ backgroundColor: colors.primary[500] }}
                            >
                              <IoRestaurant className="text-white" />
                              Scopri Nuove Ricette
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg animate-bounce">
                <IoPhonePortrait className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          {/* Right Side - Feature List */}
          <div className="space-y-6">
            {screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className={`relative transition-all duration-500 cursor-pointer ${
                  isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                } ${
                  activeIndex === index ? 'scale-105' : 'hover:scale-102'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setActiveIndex(index)}
              >
                <div className={`p-6 rounded-2xl transition-all duration-300 ${
                  activeIndex === index
                    ? 'bg-white shadow-xl border-2 border-green-200'
                    : 'bg-gray-50 hover:bg-white hover:shadow-lg'
                }`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-gradient-to-br ${screenshot.color} text-white`}>
                    {index === 0 ? <IoPhonePortrait /> : index === 1 ? <IoRestaurant /> : index === 2 ? <IoList /> : index === 3 ? <IoSnow /> : <IoHeart />}
                  </div>

                  {/* Content */}
                  <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                    activeIndex === index ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {screenshot.title}
                  </h3>
                  <p className="text-gray-600">
                    {screenshot.description}
                  </p>

                  {/* Active Indicator */}
                  {activeIndex === index && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-green-600 rounded-r-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-12 gap-3">
          {screenshots.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeIndex === index ? 'bg-green-600 w-8' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}