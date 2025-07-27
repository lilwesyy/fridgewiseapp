import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  details: any;
  isOffline: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true, // Default to true to avoid showing offline on first load
    isInternetReachable: null,
    type: null,
    details: null,
    isOffline: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      const status = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
        isOffline: !(state.isConnected && state.isInternetReachable),
      };
      setNetworkStatus(status);
      setIsInitialized(true);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const status = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
        isOffline: !(state.isConnected && state.isInternetReachable),
      };
      setNetworkStatus(status);
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isInitialized]);

  const refresh = async () => {
    const state = await NetInfo.fetch();
    const status = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      details: state.details,
      isOffline: !(state.isConnected && state.isInternetReachable),
    };
    setNetworkStatus(status);
    return status;
  };

  return {
    ...networkStatus,
    isInitialized,
    refresh,
  };
};