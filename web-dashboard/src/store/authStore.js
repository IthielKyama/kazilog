import { create } from 'zustand';

// Parse initial state from localStorage if it exists
const storedUser = localStorage.getItem('kazilog_user');
const storedToken = localStorage.getItem('kazilog_token');

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  
  login: (userData, token) => {
    localStorage.setItem('kazilog_user', JSON.stringify(userData));
    localStorage.setItem('kazilog_token', token);
    set({ user: userData, token });
  },

  updateUser: (userData) => {
    localStorage.setItem('kazilog_user', JSON.stringify(userData));
    set({ user: userData });
  },
  
  logout: () => {
    localStorage.removeItem('kazilog_user');
    localStorage.removeItem('kazilog_token');
    set({ user: null, token: null });
  }
}));
