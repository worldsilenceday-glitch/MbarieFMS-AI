import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'STOREKEEPER' | 'TECHNICIAN' | 'GUEST';
  jobTitle: string;
  department: string;
  facility: string;
  lastLogin?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
}

interface RegisterData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'STOREKEEPER' | 'TECHNICIAN' | 'GUEST';
  jobTitle: string;
  department: string;
  facility: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // API base URL
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        const isValid = await verifyToken();
        if (!isValid) {
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Failed to connect to server',
      };
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Failed to connect to server',
      };
    }
  };

  // Verify token function
  const verifyToken = async (): Promise<boolean> => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${savedToken}`,
        },
      });

      const data: AuthResponse = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(savedToken);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token verification error:', error);
      logout();
      return false;
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data: AuthResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Password change error:', error);
      return {
        success: false,
        message: 'Failed to connect to server',
      };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Get auth headers for API calls (commented out for now)
  // const getAuthHeaders = () => {
  //   return {
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //   };
  // };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    verifyToken,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
