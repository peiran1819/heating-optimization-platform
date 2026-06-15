import { create } from 'zustand';

export interface UserInfo {
  name: string;
  avatar?: string;
  role?: string;
}

interface UserState {
  userInfo: UserInfo | null;
  token: string | null;
  login: (userInfo: UserInfo, token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: null,
  login: (userInfo, token) => set({ userInfo, token }),
  logout: () => set({ userInfo: null, token: null }),
}));
