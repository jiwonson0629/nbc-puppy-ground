import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthStore = {
  isAuthInitialized: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  setIsAuthInitialized: (isAuthInitialized: boolean) => void;
};

const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthInitialized: false,
      user: null,
      setUser: (user) => set(() => ({ user })),
      setIsAuthInitialized: (isAuthInitialized) => set(() => ({ isAuthInitialized }))
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useAuth;
