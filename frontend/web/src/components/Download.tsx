'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoCheckmarkCircle, IoRestaurant, IoLeaf, IoStar, IoHappy } from 'react-icons/io5';
import { colors } from '@/config/theme';

export default function Download() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically send the email to your backend
      console.log('Email submitted:', email);
    }
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-green-600 to-green-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 text-6xl animate-float">
          <IoLeaf className="text-white" />
        </div>
        <div className="absolute top-40 right-32 text-4xl animate-float-delayed">
          <IoRestaurant className="text-white" />
        </div>
        <div className="absolute bottom-32 left-16 text-5xl animate-float">
          <IoLeaf className="text-white" />
        </div>
        <div className="absolute bottom-20 right-20 text-3xl animate-float-delayed">
          <IoRestaurant className="text-white" />
        </div>
        <div className="absolute top-60 left-1/3 text-4xl animate-float">
          <IoLeaf className="text-white" />
        </div>
        <div className="absolute top-32 right-1/4 text-5xl animate-float-delayed">
          <IoRestaurant className="text-white" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
          }`}>
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Pronto a trasformare
                <span className="block">la tua cucina?</span>
              </h2>
              <p className="text-xl text-green-100 leading-relaxed">
                Scarica Adesso FridgeWiseAI oggi e inizia a cucinare in modo più intelligente, 
                sostenibile e delizioso.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 py-8 border-t border-green-500/30">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10k+</div>
                <div className="text-sm text-green-200">Download</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">4.8★</div>
                <div className="text-sm text-green-200">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-sm text-green-200">Soddisfazione</div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-6">
              <button className="group w-full px-8 py-5 rounded-2xl font-bold text-lg transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden"
                      style={{
                        backgroundColor: colors.background.surface,
                        color: colors.primary[600],
                        boxShadow: `
                          0 10px 30px -5px rgba(0, 0, 0, 0.3),
                          0 4px 6px -2px rgba(0, 0, 0, 0.1),
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                        e.currentTarget.style.boxShadow = `
                          0 20px 40px -10px rgba(0, 0, 0, 0.4),
                          0 8px 16px -4px rgba(0, 0, 0, 0.2),
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                        `;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = `
                          0 10px 30px -5px rgba(0, 0, 0, 0.3),
                          0 4px 6px -2px rgba(0, 0, 0, 0.1),
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `;
                      }}>
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                     style={{ background: `linear-gradient(90deg, ${colors.primary[100]}, ${colors.primary[200]})` }}></div>
                
                <IoPhonePortrait className="text-3xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                <span className="group-hover:tracking-wide transition-all duration-300">Scarica per iOS</span>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 transition-all duration-1000 group-hover:translate-x-full"></div>
              </button>
              
              <div className="text-center">
                <p className="text-green-200 text-sm mb-3">
                  Oppure ricevi il link via email
                </p>
                {!isSubmitted ? (
                  <form onSubmit={handleEmailSubmit} className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="La tua email"
                      className="flex-1 px-5 py-4 rounded-xl border-0 text-lg font-medium transition-all duration-300 focus:scale-105"
                      style={{
                        backgroundColor: colors.background.surface,
                        color: colors.text.primary,
                        boxShadow: `
                          0 4px 15px -3px rgba(0, 0, 0, 0.2),
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = `
                          0 8px 25px -5px rgba(0, 0, 0, 0.3),
                          0 0 0 3px ${colors.primary[200]}50,
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                        `;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = `
                          0 4px 15px -3px rgba(0, 0, 0, 0.2),
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `;
                      }}
                      required
                    />
                    <button
                      type="submit"
                      className="group px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 relative overflow-hidden"
                      style={{
                        backgroundColor: colors.primary[700],
                        color: colors.background.surface,
                        boxShadow: `
                          0 4px 15px -3px ${colors.primary[700]}50,
                          inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
                        `
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary[800];
                        e.currentTarget.style.transform = 'scale(1.05) translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary[700];
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span className="group-hover:tracking-wide transition-all duration-300">Invia</span>
                      {/* Button shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full"></div>
                    </button>
                  </form>
                ) : (
                  <div className="px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-500 animate-pulse"
                       style={{
                         backgroundColor: colors.primary[700] + '80',
                         color: colors.background.surface,
                         backdropFilter: 'blur(10px)',
                         boxShadow: `
                           0 8px 25px -5px ${colors.primary[500]}40,
                           inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
                         `
                       }}>
                    <IoCheckmarkCircle className="text-2xl animate-bounce" />
                    <span className="font-bold text-lg">Link inviato! Controlla la tua email</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              {[
                { text: 'Scansione AI degli ingredienti', icon: IoPhonePortrait },
                { text: 'Ricette personalizzate illimitate', icon: IoRestaurant },
                { text: 'Gestione intelligente delle scadenze', icon: IoCheckmarkCircle },
                { text: 'Supporto per tutte le diete', icon: IoLeaf }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-green-100">
                  <feature.icon className="text-green-300" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - App Preview */}
          <div className={`relative transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            <div className="relative">
              {/* Main Phone */}
              <div className="relative mx-auto w-80 h-[600px] transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl">
                  <div className="absolute inset-2 bg-black rounded-[2.5rem] overflow-hidden">
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
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                            <IoRestaurant className="text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">FridgeWiseAI</h3>
                          <p className="text-sm text-gray-600">La tua cucina intelligente</p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-green-50 p-4 rounded-xl text-center">
                            <IoPhonePortrait className="text-2xl text-green-600 mx-auto mb-2" />
                            <div className="text-sm font-medium">Scansiona</div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <IoRestaurant className="text-2xl text-blue-600 mx-auto mb-2" />
                            <div className="text-sm font-medium">Ricette</div>
                          </div>
                        </div>
                        
                        {/* Recent Recipe */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                              <IoRestaurant className="text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">Pasta al Pomodoro</h4>
                              <p className="text-xs text-gray-500">Cucinata ieri</p>
                            </div>
                            <div className="flex items-center text-yellow-500">
                              <IoStar />
                              <span className="ml-1">4.9</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* CTA Button */}
                        <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">
                          Inizia a Cucinare
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Phone (Blurred) */}
              <div className="absolute top-8 -left-8 w-80 h-[600px] transform -rotate-12 opacity-30 blur-sm">
                <div className="absolute inset-0 bg-gray-700 rounded-[3rem]">
                  <div className="absolute inset-2 bg-gray-800 rounded-[2.5rem]"></div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 bg-white rounded-full p-4 shadow-xl animate-bounce">
                <IoStar className="text-3xl text-yellow-500" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-full p-4 shadow-xl animate-pulse">
                <IoHappy className="text-3xl text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="text-center mt-16">
          <p className="text-green-200 text-sm">
            Disponibile su iOS • Android in arrivo • Gratuito con acquisti in-app
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite 2s;
        }
      `}</style>
    </section>
  );
}