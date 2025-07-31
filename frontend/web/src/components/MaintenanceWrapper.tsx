'use client';

import { useMaintenance } from '@/hooks/useMaintenance';
import MaintenancePage from './MaintenancePage';

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export default function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { shouldShowMaintenance, authenticate, isLoading } = useMaintenance();

  // Mostra un loading durante l'inizializzazione
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Se siamo in modalità manutenzione e non autenticati, mostra la pagina di manutenzione
  if (shouldShowMaintenance) {
    return <MaintenancePage onAuthenticated={authenticate} />;
  }

  // Altrimenti mostra il contenuto normale
  return <>{children}</>;
}