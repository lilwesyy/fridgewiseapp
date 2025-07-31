'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoRestaurant, IoList, IoSnow, IoHeart, IoCamera } from 'react-icons/io5';

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
                    
                    {/* Dynamic Content */}
                    <div className="px-4 py-2 h-full">
                      {activeIndex === 0 && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold">Scansiona Ingredienti</h3>
                            <p className="text-sm text-gray-600">Punta la fotocamera verso il frigo</p>
                          </div>
                          <div className="bg-gray-900 rounded-2xl h-64 flex items-center justify-center relative">
                            <IoCamera className="text-4xl text-white animate-pulse" />
                            <div className="absolute inset-4 border-2 border-green-400 rounded-2xl animate-pulse"></div>
                            <div className="absolute bottom-4 left-4 right-4">
                              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                                <div className="text-xs text-gray-700">Rilevati:</div>
                                <div className="flex gap-1 mt-1">
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    <IoRestaurant className="text-xs" /> Pomodori
                                  </span>
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                    <IoRestaurant className="text-xs" /> Aglio
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
                            Conferma Ingredienti
                          </button>
                        </div>
                      )}

                      {activeIndex === 1 && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold">Ricette per Te</h3>
                            <p className="text-sm text-gray-600">Basate sui tuoi ingredienti</p>
                          </div>
                          <div className="space-y-3">
                            {['Pasta al Pomodoro', 'Insalata Mista', 'Zuppa di Verdure'].map((recipe, i) => (
                              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <IoRestaurant className="text-green-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">{recipe}</h4>
                                    <p className="text-xs text-gray-500">{20 + i * 5} min • Facile</p>
                                  </div>
                                  <div className="text-yellow-500">★ 4.{8 - i}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeIndex === 2 && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold">Pasta al Pomodoro</h3>
                            <p className="text-sm text-gray-600">Passo 2 di 5</p>
                          </div>
                          <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <IoRestaurant className="text-2xl text-orange-600" />
                              <span className="font-medium">Scalda l&apos;olio</span>
                            </div>
                            <p className="text-sm text-gray-700">
                              In una padella, scalda 2 cucchiai di olio extravergine di oliva a fuoco medio.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Indietro</button>
                            <button className="flex-1 bg-green-600 text-white py-2 rounded-lg">Avanti</button>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full w-2/5"></div>
                          </div>
                        </div>
                      )}

                      {activeIndex === 3 && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold">Il Mio Frigo</h3>
                            <p className="text-sm text-gray-600">Gestisci le scadenze</p>
                          </div>
                          <div className="space-y-2">
                            {[
                              { name: 'Pomodori', days: 3, color: 'green' },
                              { name: 'Latte', days: 1, color: 'orange' },
                              { name: 'Yogurt', days: 0, color: 'red' }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center justify-between bg-white border rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    item.color === 'green' ? 'bg-green-500' : 
                                    item.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className="font-medium">{item.name}</span>
                                </div>
                                <span className={`text-sm ${
                                  item.color === 'green' ? 'text-green-600' : 
                                  item.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {item.days === 0 ? 'Scade oggi' : `${item.days} giorni`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeIndex === 4 && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="text-lg font-bold">Ricette Salvate</h3>
                            <p className="text-sm text-gray-600">I tuoi piatti preferiti</p>
                          </div>
                          <div className="space-y-3">
                            {['Carbonara', 'Risotto ai Funghi', 'Tiramisù'].map((recipe, i) => (
                              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <IoRestaurant className="text-red-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">{recipe}</h4>
                                    <p className="text-xs text-gray-500">Cucinato {i + 1} volte</p>
                                  </div>
                                  <IoHeart className="text-red-500" />
                                </div>
                              </div>
                            ))}
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