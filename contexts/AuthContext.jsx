import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        router.push('/dashboard');
        return { success: true };
      } else {
        setError(data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        router.push('/verification');
        return { success: true };
      } else {
        setError(data.message);
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore errors
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user || !user.permissions) return false;
    return permissions.some((p) => user.permissions.includes(p));
  };

  const isAdmin = () => {
    return user?.role?.name === 'ADMIN';
  };

  const isEditor = () => {
    return user?.role?.name === 'EDITOR' || isAdmin();
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    fetchUser,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isEditor,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
