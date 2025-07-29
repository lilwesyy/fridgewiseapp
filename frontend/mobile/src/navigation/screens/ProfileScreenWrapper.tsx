import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileScreen } from '../../components/screens';

export const ProfileScreenWrapper: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by auth state change
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProfileScreen
      onLogout={handleLogout}
    />
  );
};