// utils/auth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

// Mock user data - in a real app this would come from an API
const mockUsers = {
  'admin@example.com': {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    password: 'admin', // In a real app, never store plain text passwords
  },
  'user@example.com': {
    id: 2,
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user',
    password: 'user',
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for saved user in localStorage on initial load
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login - In a real app, call an API
    const user = mockUsers[email];
    
    if (user && user.password === password) {
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const withAuth = (Component, roles = []) => {
  const AuthenticatedComponent = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        // If no user is logged in, redirect to login
        if (!user) {
          router.replace('/login');
        } 
        // If roles are specified and user role doesn't match, redirect
        else if (roles.length > 0 && !roles.includes(user.role)) {
          if (user.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/dashboard');
          }
        }
      }
    }, [user, loading, router]);

    // Show loading or render component based on authentication state
    if (loading || !user) {
      return <div>Loading...</div>; // Could be a nicer loading component
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      return <div>Access denied. Insufficient permissions.</div>;
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
};