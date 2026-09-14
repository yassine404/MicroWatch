import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextBase';
import { login as apiLogin, signup as apiSignup } from '../api/auth';

function decodeJWT(token: string): User | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded && decoded.username && decoded.role) {
      return decoded as User;
    }
    return null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const decoded = decodeJWT(storedToken);
        if (decoded) {
          setUser(decoded);
          setToken(storedToken);
        } else {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiLogin(username, password);
      const newToken = response.data.token;
      if (!newToken) {
        throw new Error('Token non reçu');
      }
      const decoded = decodeJWT(newToken);
      if (!decoded) {
        throw new Error('Token invalide');
      }
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(decoded);
      console.log('✅ Login réussi, utilisateur :', decoded);
    } catch (error) {
      console.error('❌ Erreur login:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    await apiSignup(username, email, password);
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};