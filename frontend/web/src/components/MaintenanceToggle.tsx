'use client';

import { useState } from 'react';
import { useMaintenance } from '@/hooks/useMaintenance';
import { Settings, AlertTriangle } from 'lucide-react';

export default function MaintenanceToggle() {
  const { isMaintenanceMode, enableMaintenanceMode, disableMaintenanceMode } = useMaintenance();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = () => {
    if (isMaintenanceMode) {
      disableMaintenanceMode();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const confirmEnable = () => {
    enableMaintenanceMode();
    setShowConfirm(false);
  };

  return (
    <>
      {/* Hidden button - appears only with Ctrl+Shift+M */}
      <div 
        className="fixed bottom-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity duration-300"
        onKeyDown={(e) => {
          if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            handleToggle();
          }
        }}
        tabIndex={0}
      >
        <button
          onClick={handleToggle}
          className={`p-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 ${
            isMaintenanceMode 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          title={`${isMaintenanceMode ? 'Disable' : 'Enable'} maintenance mode (Ctrl+Shift+M)`}
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Enable Maintenance Mode?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              This will make the site inaccessible to users. Only those who know the password will be able to access it.
            </p>
            
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors duration-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnable}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Enable Maintenance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}