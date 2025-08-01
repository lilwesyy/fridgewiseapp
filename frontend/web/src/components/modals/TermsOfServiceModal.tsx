'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/config/theme';
import { useLanguage } from '@/contexts/LanguageContext';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t, isLoading } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (isLoading || !isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isAnimating ? 'opacity-100 backdrop-blur-sm' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      
      <div className={`relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ease-out ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="w-16"></div>
          <h2 className="text-xl font-semibold text-gray-900">{t.modals.termsOfService.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            {t.modals.close}
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-6">
          <div className="prose prose-gray max-w-none">
            <p className="text-sm text-gray-500 mb-6">
              {t.modals.termsOfService.lastUpdated}: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.acceptance.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.termsOfService.acceptance.content}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.description.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.termsOfService.description.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.termsOfService.description.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.userAccount.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.termsOfService.userAccount.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.termsOfService.userAccount.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.acceptableUse.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.termsOfService.acceptableUse.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.termsOfService.acceptableUse.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.intellectualProperty.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.termsOfService.intellectualProperty.content}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.liability.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.termsOfService.liability.content}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.termination.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.termsOfService.termination.content}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.changes.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.termsOfService.changes.content}
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.termsOfService.contact.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.termsOfService.contact.content}
              </p>
            </section>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                {t.modals.termsOfService.medicalDisclaimer.title}
              </h3>
              <p className="text-yellow-700">
                {t.modals.termsOfService.medicalDisclaimer.content}
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-orange-800 mb-4">
                {t.modals.termsOfService.allergyDisclaimer.title}
              </h3>
              <p className="text-orange-700">
                {t.modals.termsOfService.allergyDisclaimer.content}
              </p>
            </div>

            <section>
              <p className="text-gray-600 text-sm">
                Questi Termini di Servizio sono governati dalle leggi italiane ed europee. Eventuali controversie saranno risolte dai tribunali competenti in Italia.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}