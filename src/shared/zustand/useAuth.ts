import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type AuthStore = {
  user: User | null;
  setUser: (user: User | null) => void;
};

const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set(() => ({ user }))
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useAuth;
