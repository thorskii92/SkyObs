import { clearCurrentUser, getCurrentUser, setCurrentUser } from '@/src/utils/db';
import { SQLiteDatabase } from 'expo-sqlite';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState
} from 'react';
import { updateUserProfile } from '../utils/api';

type User = {
    id?: number;
    user_id?: number; // ✅ mapped from API's user_id
    username: string;
    fullName?: string;
    userType?: string;
    status?: string;
    station_id?: number | null;
    auth_token: string;
    createdAt?: string;
    updatedAt?: string;

    station_name?: string | null;
    station_code?: string | null;
    station_province?: string | null;
    station_town?: string | null;
} | null;

type UserContextType = {
    user: User;
    loading: boolean;
    refreshUser: () => Promise<void>;
    login: (db: SQLiteDatabase, userData: any) => Promise<void>;
    logout: (db: SQLiteDatabase) => Promise<void>;
    updateUser: (updates: Partial<User>) => Promise<boolean>; // ✅ NEW
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
    children,
    db
}: {
    children: ReactNode;
    db: SQLiteDatabase;
}) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        const current = await getCurrentUser(db);
        setUser(current);
    };

    const login = async (database: SQLiteDatabase, userData: any) => {
        await setCurrentUser(database, userData);
        await refreshUser();
    };

    const logout = async (database: SQLiteDatabase) => {
        await clearCurrentUser(database);
        setUser(null);
    };

    // ✅ NEW: Update user (API + local DB sync) with logs
    const updateUser = async (updates: Partial<User>): Promise<boolean> => {

        if (!user || !user.id) {
            console.warn("updateUser aborted: user or user.id is missing");
            return false;  // ✅ use user.id, mapped from user_id
        }

        try {
            const res = await updateUserProfile(user.id, {
                fullName: updates.fullName,
                userType: updates.userType,
                status: updates.status,
                default_station_id: updates.station_id ?? undefined,
            });

            if (!res) {
                console.warn("updateUser failed: API returned falsy response");
                return false;
            }

            const updatedUser = {
                ...user,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await setCurrentUser(db, updatedUser);

            setUser(updatedUser);

            return true;
        } catch (error) {
            console.error("updateUser error:", error);
            return false;
        }
    };

    useEffect(() => {
        const init = async () => {
            await refreshUser();
            setLoading(false);
        };

        init();
    }, []);

    return (
        <UserContext.Provider
            value={{
                user,
                loading,
                refreshUser,
                login,
                logout,
                updateUser // ✅ exposed
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used inside UserProvider');
    }
    return context;
};