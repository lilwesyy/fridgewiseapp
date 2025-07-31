'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoRestaurant, IoTime, IoFitness, IoStatsChart, IoLeaf, IoSparkles } from 'react-icons/io5';

const features = [
  {
    icon: IoPhonePortrait,
    title: 'Scansione AI Avanzata',
    description: 'Riconosce automaticamente gli ingredienti nel tuo frigo con precisione del 95%',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: IoRestaurant,
    title: 'Ricette Personalizzate',
    description: 'Genera ricette uniche basate sui tuoi ingredienti e preferenze alimentari',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: IoTime,
    title: 'Gestione Scadenze',
    description: 'Monitora le scadenze e ricevi notifiche per evitare sprechi alimentari',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: IoFitness,
    title: 'Diete Specifiche',
    description: 'Supporta diete vegetariane, vegane, senza glutine e altre preferenze',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: IoStatsChart,
    title: 'Analytics Nutrizionali',
    description: 'Traccia i valori nutrizionali e monitora la tua alimentazione',
    color: 'from-red-500 to-red-600'
  },
  {
    icon: IoLeaf,
    title: 'Sostenibilità',
    description: 'Riduci gli sprechi alimentari e contribuisci a un futuro più sostenibile',
    color: 'from-teal-500 to-teal-600'
  }
];

export default function Features() {
  const [visibleFeatures, setVisibleFeatures] = useState<boolean[]>(new Array(features.length).fill(false));
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers = featureRefs.current.map((ref, index) => {
      if (!ref) return null;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleFeatures(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }
        },
        { threshold: 0.3 }
      );
      
      observer.observe(ref);
      return observer;
    });

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Tutto quello che ti serve per
            <span className="text-green-600 block">cucinare meglio</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            FridgeWise combina intelligenza artificiale e design intuitivo per trasformare 
            il modo in cui cucini e gestisci la tua cucina.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={el => { featureRefs.current[index] = el; }}
              className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform ${
                visibleFeatures[index] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              } hover:-translate-y-2`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon />
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-200 rounded-2xl transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-full font-medium">
            <IoSparkles className="text-lg" />
            <span>E molto altro ancora nell&apos;app!</span>
          </div>
        </div>
      </div>
    </section>
  );
}