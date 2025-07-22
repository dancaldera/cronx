import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@cronx/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

type AuthStore = AuthState & AuthActions;

const authStore = (set: any, get: any) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => {
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  updateUser: (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...userData },
      });
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    set({
      accessToken,
      refreshToken,
    });
  },
});

export const useAuthStore = create<AuthStore>()(
  persist(authStore, {
    name: 'cronx-auth-storage',
    partialize: (state) => ({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
    }),
    // Add storage event listener for better hydration
    onRehydrateStorage: () => {
      console.log('Hydrating auth store from localStorage...');
      return (state) => {
        if (state) {
          console.log('Auth store hydrated:', { 
            isAuthenticated: state.isAuthenticated, 
            hasUser: !!state.user,
            hasTokens: !!state.accessToken 
          });
        }
      };
    },
  })
);