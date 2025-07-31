'use client';

import { useState, useEffect } from 'react';
import { MAINTENANCE_CONFIG } from '@/config/maintenance';

export function useMaintenance() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Controlla se l'utente è già autenticato
    const authenticated = localStorage.getItem(MAINTENANCE_CONFIG.STORAGE_KEY) === 'true';
    setIsAuthenticated(authenticated);
    
    setIsLoading(false);
  }, []);

  const authenticate = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(MAINTENANCE_CONFIG.STORAGE_KEY);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    shouldShowMaintenance: !isAuthenticated
  };
}