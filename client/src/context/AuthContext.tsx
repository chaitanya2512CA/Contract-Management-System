import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: { email: string; password: string }) => Promise<User>;
  register: (data: any) => Promise<User>;
  loginStudent: (creds: { email: string; password: string }) => Promise<User>;
  loginOrganizer: (creds: { email: string; password: string }) => Promise<User>;
  loginAdmin: (creds: { email: string; password: string }) => Promise<User>;
  registerStudent: (data: any) => Promise<User>;
  registerOrganizer: (data: any) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('campuspulse_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('campuspulse_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('campuspulse_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('campuspulse_user', JSON.stringify(res.data.user));
          }
        } catch (err: any) {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.warn('Session verification failed with 401/403, clearing credentials.');
            localStorage.removeItem('campuspulse_token');
            localStorage.removeItem('campuspulse_user');
            setUser(null);
            setToken(null);
          } else {
            console.warn('Network or server error during session verification, keeping cached session active.', err);
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const handleAuthSuccess = (resData: { token: string; user: User }) => {
    localStorage.setItem('campuspulse_token', resData.token);
    localStorage.setItem('campuspulse_user', JSON.stringify(resData.user));
    setToken(resData.token);
    setUser(resData.user);
    return resData.user;
  };

  const login = async (creds: { email: string; password: string }) => {
    const res = await authService.login(creds);
    return handleAuthSuccess(res.data);
  };

  const register = async (data: any) => {
    const res = await authService.register(data);
    return handleAuthSuccess(res.data);
  };

  const loginStudent = async (creds: { email: string; password: string }) => {
    const res = await authService.loginStudent(creds);
    return handleAuthSuccess(res.data);
  };

  const loginOrganizer = async (creds: { email: string; password: string }) => {
    const res = await authService.loginOrganizer(creds);
    return handleAuthSuccess(res.data);
  };

  const loginAdmin = async (creds: { email: string; password: string }) => {
    const res = await authService.loginAdmin(creds);
    return handleAuthSuccess(res.data);
  };

  const registerStudent = async (data: any) => {
    const res = await authService.registerStudent(data);
    return handleAuthSuccess(res.data);
  };

  const registerOrganizer = async (data: any) => {
    const res = await authService.registerOrganizer(data);
    return handleAuthSuccess(res.data);
  };

  const logout = () => {
    localStorage.removeItem('campuspulse_token');
    localStorage.removeItem('campuspulse_user');
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('campuspulse_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        loginStudent,
        loginOrganizer,
        loginAdmin,
        registerStudent,
        registerOrganizer,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
