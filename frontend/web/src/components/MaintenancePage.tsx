'use client';

import { useState } from 'react';
import { colors } from '@/config/theme';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface MaintenancePageProps {
    onAuthenticated: () => void;
}

export default function MaintenancePage({ onAuthenticated }: MaintenancePageProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t, isLoading: langLoading } = useLanguage();

    if (langLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent absolute top-0 left-0" style={{ borderTopColor: colors.primary[500] }}></div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (password === 'mirco') {
            localStorage.setItem('maintenance_authenticated', 'true');
            onAuthenticated();
        } else {
            setError(t.maintenance.incorrectPassword);
        }

        setIsLoading(false);
    };

    return (
        <main className="min-h-screen bg-white flex flex-col p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white"></div>

            <div className="relative flex-1 flex items-center justify-center">
                <div className="max-w-2xl w-full text-center">
                    {/* Logo and Brand */}
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <div className="w-12 h-12 relative">
                            <Image src="/assets/logo.svg" alt="FridgeWiseAI" fill className="object-contain" />
                        </div>
                        <span className="text-2xl font-semibold text-gray-900">FridgeWiseAI</span>
                    </div>

                    {/* Main Message */}
                    <div className="mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-8">
                            {t.maintenance.title}
                            <span className="block" style={{ color: colors.primary[500] }}>{t.maintenance.titleHighlight}</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 font-light leading-relaxed max-w-xl mx-auto">
                            {t.maintenance.subtitle}
                        </p>
                    </div>

                    {/* Admin Access */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                            {t.maintenance.adminAccess}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-transparent text-center text-gray-900"
                                style={{ color: '#1f2937' }}
                                onFocus={(e) => {
                                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary[500]}40`;
                                    e.currentTarget.style.borderColor = colors.primary[500];
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                                placeholder={t.maintenance.passwordPlaceholder}
                                required
                            />

                            {error && (
                                <div className="text-red-500 text-sm">{error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full text-white py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                                style={{ backgroundColor: colors.primary[500] }}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t.maintenance.verifying}
                                    </div>
                                ) : (
                                    t.maintenance.login
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative border-t border-gray-100 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                    <span>© 2024 FridgeWiseAI Inc.</span>
                    <a href="mailto:support@fridgewiseai.com" className="hover:text-gray-700 transition-colors">
                        {t.maintenance.support}
                    </a>
                    <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary[500] }}></div>
                        {t.maintenance.completelyFree}
                    </span>
                </div>
            </footer>
        </main>
    );
}