'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/config/theme';
import { useLanguage } from '@/contexts/LanguageContext';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
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
          <h2 className="text-xl font-semibold text-gray-900">{t.modals.privacyPolicy.title}</h2>
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
              {t.modals.privacyPolicy.lastUpdated}: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.dataCollection.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.dataCollection.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.dataCollection.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.dataUse.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.dataUse.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.dataUse.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.dataSharing.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.dataSharing.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.dataSharing.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.dataSecurity.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.dataSecurity.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.dataSecurity.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.userRights.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.userRights.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.userRights.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.dataRetention.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.dataRetention.content}
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                {t.modals.privacyPolicy.dataRetention.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-red-800 mb-4">
                {t.modals.privacyPolicy.disclaimer.title}
              </h3>
              <p className="text-red-700 mb-4">
                {t.modals.privacyPolicy.disclaimer.content}
              </p>
              <ul className="list-disc list-inside text-red-700 space-y-2">
                {t.modals.privacyPolicy.disclaimer.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.contact.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {t.modals.privacyPolicy.contact.content}
              </p>
              <p className="text-gray-900 font-medium">{t.modals.privacyPolicy.contact.email}</p>
              <p className="text-gray-900 font-medium">{t.modals.privacyPolicy.contact.dpo}</p>
              <p className="text-gray-600 mt-2">
                {t.modals.privacyPolicy.contact.response}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ color: colors.primary[500] }}>
                {t.modals.privacyPolicy.effective.title}
              </h3>
              <p className="text-gray-600">
                {t.modals.privacyPolicy.effective.content.replace('{date}', new Date().toLocaleDateString('it-IT'))}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}