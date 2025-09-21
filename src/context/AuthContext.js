import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for active session when the app loads
    const checkSession = async () => {
      try {
        const data = await api.get('/auth');
        if (data.loggedIn) {
          setUser(data.user); // Use the full user object from the session
        }
      } catch (error) {
        console.error('Session check failed', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.post('/auth', { email, password });
      if (data.success) {
        setUser(data.user);
      }
      return data;
    } catch (error) {
      console.error('Login failed', error);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // We can implement a server-side logout later if needed
      // await api.post('/auth.php?action=logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const value = {
    user,
    isLoggedIn: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
