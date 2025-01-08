import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type UserRole = 'dispatch' | 'driver' | 'admin';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, role: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage if available
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      const { user, role } = JSON.parse(storedSession);
      setUser(user);
      setUserRole(role);
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userData = session.user;
        const userRole = userData.user_metadata?.role as UserRole;
        setUser(userData);
        setUserRole(userRole);
        // Store session data in localStorage
        localStorage.setItem('supabase.auth.token', JSON.stringify({ 
          user: userData,
          role: userRole
        }));
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userData = session.user;
        const userRole = userData.user_metadata?.role as UserRole;
        setUser(userData);
        setUserRole(userRole);
        // Update localStorage on auth state change
        localStorage.setItem('supabase.auth.token', JSON.stringify({ 
          user: userData,
          role: userRole
        }));
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('supabase.auth.token');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    if (response.data.user) {
      setUserRole((response.data.user.user_metadata?.role as UserRole) ?? null);
    }
    return response;
  };

  const signUp = async (email: string, password: string, role: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        }
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
  };

  const value = {
    user,
    userRole,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
