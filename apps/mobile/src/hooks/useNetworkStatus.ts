import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected:  boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected:         true,
    isInternetReachable: true,
    type:                'unknown',
  });

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setStatus({
        isConnected:         state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type:                state.type,
      });
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected:         state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type:                state.type,
      });
    });

    return unsubscribe;
  }, []);

  return status;
}

export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  return !isConnected || isInternetReachable === false;
}
