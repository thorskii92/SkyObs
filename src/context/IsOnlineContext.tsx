import NetInfo from "@react-native-community/netinfo";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { checkApiConnection } from "../utils/api";

type OnlineStatusContextType = {
    isOnline: boolean;
    lastChecked: Date | null;
    refreshConnection: () => Promise<boolean>;
};

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined);

export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [hasInternet, setHasInternet] = useState<boolean | null>(null); // 👈 network layer

    const refreshConnection = useCallback(async () => {
        // If no internet, skip API check
        if (hasInternet === false) {
            setIsOnline(false);
            setLastChecked(new Date());
            return false;
        }

        const status = await checkApiConnection();
        setIsOnline(status);
        setLastChecked(new Date());
        return status;
    }, [hasInternet]);

    useEffect(() => {
        NetInfo.fetch().then(state => {
            const connected = state.isConnected && state.isInternetReachable;
            setHasInternet(!!connected);
        })

        // 👇 Subscribe to network changes
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected && state.isInternetReachable;
            setHasInternet(!!connected);

            if (!connected) {
                setIsOnline(false); // immediately offline
                setLastChecked(new Date());
            } else {
                refreshConnection(); // re-check API when back online
            }
        });

        // Initial check
        refreshConnection();

        // Poll API (optional but useful)
        const interval = setInterval(refreshConnection, 10000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [refreshConnection]);

    useEffect(() => {
        if (hasInternet !== null) {
            refreshConnection();
        }
    }, [hasInternet, refreshConnection])

    return (
        <OnlineStatusContext.Provider value={{ isOnline, lastChecked, refreshConnection }}>
            {children}
        </OnlineStatusContext.Provider>
    );
};

export const useOnlineStatus = () => {
    const context = useContext(OnlineStatusContext);
    if (!context) {
        throw new Error("useOnlineStatus must be used within OnlineStatusProvider");
    }
    return context;
};