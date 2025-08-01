'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPhonePortrait, IoBulb, IoRestaurant, IoCamera, IoSparkles, IoCheckmarkCircle } from 'react-icons/io5';

const steps = [
  {
    number: '01',
    title: 'Scansiona',
    description: 'Apri l\'app e scansiona gli ingredienti nel tuo frigo con la fotocamera',
    icon: IoPhonePortrait,
    details: ['Riconoscimento automatico', 'Precisione del 95%', 'Funziona anche offline']
  },
  {
    number: '02',
    title: 'Analizza',
    description: 'L\'AI analizza gli ingredienti e le tue preferenze alimentari',
    icon: IoBulb,
    details: ['Algoritmi avanzati', 'Preferenze personali', 'Diete specifiche']
  },
  {
    number: '03',
    title: 'Cucina',
    description: 'Ricevi ricette personalizzate e inizia a cucinare subito',
    icon: IoRestaurant,
    details: ['Ricette uniche', 'Istruzioni dettagliate', 'Video tutorial']
  }
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
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
        setActiveStep(prev => (prev + 1) % steps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Come funziona
            <span className="text-green-600 block">FridgeWiseAI</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tre semplici passaggi per trasformare i tuoi ingredienti in piatti deliziosi
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative transition-all duration-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div
                  className={`flex items-start gap-6 p-6 rounded-2xl cursor-pointer transition-all duration-300 ${activeStep === index
                    ? 'bg-white shadow-xl scale-105'
                    : 'bg-white/50 hover:bg-white/80'
                    }`}
                  onClick={() => setActiveStep(index)}
                >
                  {/* Step Number */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${activeStep === index
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className={`text-2xl ${activeStep === index ? 'text-green-600' : 'text-gray-600'}`} />
                      <h3 className={`text-xl font-bold transition-colors duration-300 ${activeStep === index ? 'text-green-600' : 'text-gray-900'
                        }`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      {step.description}
                    </p>

                    {/* Details */}
                    <div className={`space-y-2 transition-all duration-300 ${activeStep === index ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0 overflow-hidden'
                      }`}>
                      {step.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-12 top-20 w-0.5 h-8 bg-gradient-to-b from-green-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side - Visual */}
          <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            <div className="relative">
              {/* Main Phone */}
              <div className="relative mx-auto w-80 h-[600px]">
                <div className="absolute inset-0 bg-gray-900 rounded-[3rem] shadow-2xl">
                  <div className="absolute inset-2 bg-black rounded-[2.5rem] overflow-hidden">
                    <div className="relative w-full h-full bg-gradient-to-b from-gray-50 to-white">
                      {/* Dynamic Content Based on Active Step */}
                      {activeStep === 0 && (
                        <div className="p-6 pt-12">
                          <div className="text-center mb-6">
                            <h4 className="font-bold text-lg">Scansiona Ingredienti</h4>
                          </div>
                          <div className="bg-gray-900 rounded-2xl h-80 flex items-center justify-center relative">
                            <IoCamera className="text-6xl text-white animate-pulse" />
                            <div className="absolute inset-4 border-2 border-green-400 rounded-2xl animate-pulse"></div>
                          </div>
                          <div className="mt-4 text-center">
                            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm inline-block">
                              Riconoscimento in corso...
                            </div>
                          </div>
                        </div>
                      )}

                      {activeStep === 1 && (
                        <div className="p-6 pt-12">
                          <div className="text-center mb-6">
                            <h4 className="font-bold text-lg">Analisi AI</h4>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <IoBulb className="text-blue-600" />
                                <span className="font-medium">Ingredienti rilevati</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Pomodori</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Basilico</span>
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Mozzarella</span>
                              </div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <IoCheckmarkCircle className="text-purple-600" />
                                <span className="font-medium">Preferenze</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Vegetariano • Italiano • 30 min
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeStep === 2 && (
                        <div className="p-6 pt-12">
                          <div className="text-center mb-6">
                            <h4 className="font-bold text-lg">Ricette Generate</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                  <IoRestaurant className="text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium">Pasta al Pomodoro</h5>
                                  <p className="text-xs text-gray-500">25 min • Facile</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                  <IoRestaurant className="text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-medium">Insalata Caprese</h5>
                                  <p className="text-xs text-gray-500">10 min • Facile</p>
                                </div>
                              </div>
                            </div>
                            <button className="w-full bg-green-600 text-white py-3 rounded-xl font-medium">
                              Inizia a Cucinare
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
                <IoSparkles className="text-2xl text-green-600 animate-bounce" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg">
                <IoCheckmarkCircle className="text-2xl text-green-600 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="flex justify-center mt-12 gap-3">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${activeStep === index ? 'bg-green-600 w-8' : 'bg-gray-300'
                }`}
              onClick={() => setActiveStep(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}