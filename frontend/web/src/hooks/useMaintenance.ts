'use client';

import { useState, useEffect } from 'react';

export function useMaintenance() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Controlla se l'utente è già autenticato
    const authenticated = localStorage.getItem('maintenance_authenticated') === 'true';
    setIsAuthenticated(authenticated);
    
    setIsLoading(false);
  }, []);

  const authenticate = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('maintenance_authenticated');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    authenticate,
    logout,
    shouldShowMaintenance: !isAuthenticated // Show maintenance only if not authenticated
  };
}