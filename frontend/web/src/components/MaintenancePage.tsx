'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { IoRestaurant, IoLeaf } from 'react-icons/io5';
import { MAINTENANCE_CONFIG } from '@/config/maintenance';

interface MaintenancePageProps {
    onAuthenticated: () => void;
}

export default function MaintenancePage({ onAuthenticated }: MaintenancePageProps) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simulate authentication delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (password === MAINTENANCE_CONFIG.ADMIN_PASSWORD) {
            localStorage.setItem(MAINTENANCE_CONFIG.STORAGE_KEY, 'true');
            onAuthenticated();
        } else {
            setError(MAINTENANCE_CONFIG.MESSAGES.errorMessage);
        }

        setIsLoading(false);
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${MAINTENANCE_CONFIG.STYLES.backgroundGradient} relative overflow-hidden`}>
            {/* Background Pattern - matching site design */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-20 text-6xl animate-float">
                    <IoLeaf className="text-green-600" />
                </div>
                <div className="absolute top-40 right-32 text-4xl animate-float-delayed">
                    <IoRestaurant className="text-green-600" />
                </div>
                <div className="absolute bottom-32 left-16 text-5xl animate-float">
                    <IoLeaf className="text-green-600" />
                </div>
                <div className="absolute bottom-20 right-20 text-3xl animate-float-delayed">
                    <IoRestaurant className="text-green-600" />
                </div>
                <div className="absolute top-60 left-1/3 text-4xl animate-float">
                    <IoLeaf className="text-green-600" />
                </div>
                <div className="absolute top-32 right-1/4 text-5xl animate-float-delayed">
                    <IoRestaurant className="text-green-600" />
                </div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center mb-6">
                            <span className="text-3xl font-bold text-gray-900">
                                FridgeWise
                            </span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
                                {MAINTENANCE_CONFIG.MESSAGES.title}
                            </h1>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                {MAINTENANCE_CONFIG.MESSAGES.subtitle}
                            </p>
                        </div>
                    </div>

                    {/* Login Form - matching site design */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
                        <div className="flex items-center justify-center mb-6">
                            <Lock className="w-6 h-6 text-green-600 mr-3" />
                            <h2 className="text-xl font-bold text-gray-900">
                                {MAINTENANCE_CONFIG.MESSAGES.loginTitle}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-300 text-lg bg-white text-gray-900 placeholder-gray-500"
                                    placeholder={MAINTENANCE_CONFIG.MESSAGES.passwordPlaceholder}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none text-lg shadow-lg"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {MAINTENANCE_CONFIG.MESSAGES.loadingButton}
                                    </div>
                                ) : (
                                    MAINTENANCE_CONFIG.MESSAGES.loginButton
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Footer Info - matching site style */}
                    <div className="text-center mt-8 space-y-3">
                        <p className="text-green-700 font-medium">
                            {MAINTENANCE_CONFIG.MESSAGES.footerMessage}
                        </p>
                        <p className="text-gray-600">
                            For support: <a href={`mailto:${MAINTENANCE_CONFIG.MESSAGES.supportEmail}`} className="text-green-600 hover:text-green-700 font-medium transition-colors duration-300">{MAINTENANCE_CONFIG.MESSAGES.supportEmail}</a>
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom CSS for animations - matching Download component */}
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
        </div>
    );
}