'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoRestaurant, IoTime, IoFitness, IoStatsChart, IoLeaf, IoSparkles } from 'react-icons/io5';
import { colors } from '@/config/theme';

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
    <section className="py-20" style={{ backgroundColor: colors.background.surface }}>
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6" style={{ color: colors.text.primary }}>
            Tutto quello che ti serve per
            <span className="block" style={{ color: colors.primary[500] }}>cucinare meglio</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: colors.text.secondary }}>
            FridgeWiseAI combina intelligenza artificiale e design intuitivo per trasformare 
            il modo in cui cucini e gestisci la tua cucina.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={el => { featureRefs.current[index] = el; }}
              className={`group relative rounded-3xl p-8 transition-all duration-700 transform cursor-pointer ${
                visibleFeatures[index] 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-12'
              } hover:-translate-y-3 hover:rotate-1`}
              style={{ 
                backgroundColor: colors.background.surface,
                transitionDelay: `${index * 150}ms`,
                boxShadow: `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  0 0 0 1px ${colors.primary[100]}20
                `
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `
                  0 25px 50px -12px rgba(0, 0, 0, 0.25),
                  0 20px 25px -5px rgba(0, 0, 0, 0.1),
                  0 0 0 1px ${colors.primary[200]}40,
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
                `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `
                  0 4px 6px -1px rgba(0, 0, 0, 0.1),
                  0 2px 4px -1px rgba(0, 0, 0, 0.06),
                  0 0 0 1px ${colors.primary[100]}20
                `;
              }}
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 rounded-3xl transition-all duration-500"
                   style={{ 
                     background: `linear-gradient(135deg, ${colors.primary[100]}, ${colors.primary[200]})` 
                   }}></div>
              
              {/* Floating Icon Container */}
              <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative overflow-hidden"
                     style={{ 
                       backgroundColor: colors.primary[500],
                       color: colors.background.surface,
                       boxShadow: `
                         0 10px 25px -5px ${colors.primary[500]}40,
                         0 4px 6px -2px ${colors.primary[500]}20
                       `
                     }}>
                  <feature.icon />
                  {/* Icon shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-1000 group-hover:translate-x-full"></div>
                </div>
                {/* Icon reflection */}
                <div className="absolute -bottom-2 left-2 w-16 h-16 rounded-2xl opacity-20 blur-md"
                     style={{ backgroundColor: colors.primary[300] }}></div>
              </div>

              {/* Enhanced Content */}
              <div className="relative space-y-4">
                <h3 className="text-2xl font-bold transition-all duration-300 group-hover:text-opacity-90"
                    style={{ 
                      color: colors.text.primary,
                      fontWeight: '700',
                      lineHeight: '1.2'
                    }}>
                  {feature.title}
                </h3>
                <p className="text-lg leading-relaxed transition-colors duration-300 group-hover:text-opacity-80" 
                   style={{ 
                     color: colors.text.secondary,
                     lineHeight: '1.6'
                   }}>
                  {feature.description}
                </p>
              </div>

              {/* Interactive Border */}
              <div className="absolute inset-0 border-2 border-transparent rounded-3xl transition-all duration-500 group-hover:border-opacity-30"
                   style={{ 
                     background: `linear-gradient(135deg, transparent, ${colors.primary[100]}20, transparent)`,
                     borderColor: colors.primary[300]
                   }}></div>
              
              {/* Corner accent */}
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ backgroundColor: colors.primary[400] }}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium"
               style={{ 
                 backgroundColor: colors.primary[50], 
                 color: colors.primary[700] 
               }}>
            <IoSparkles className="text-lg" />
            <span>E molto altro ancora nell&apos;app!</span>
          </div>
        </div>
      </div>
    </section>
  );
}