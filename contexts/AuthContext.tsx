import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode, Service } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithCredentials: (e: string, p: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (e: string, p: string, u: string, g: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleDemoLogin = (customUser?: any, customProfile?: any, persist: boolean = false) => {
      const u = customUser || { id: 'u_demo', email: 'demo@student.com' };
      const p = customProfile || {
        id: 'u_demo',
        username: 'demo_user',
        avatar_url: null,
        background_url: null,
        bio: 'Usuário de demonstração',
        followers_count: 0,
        following_count: 0,
        role: 'student',
        group_id: 'g1',
      };
      
      setUser(u);
      setProfile(p);
      setLoading(false);
      
      if (persist) {
          localStorage.setItem('demo_user_session', JSON.stringify({ user: u, profile: p }));
      }
      return { success: true };
  };

  const fetchProfile = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('profiles').select('*, group:groups(*)').eq('id', userId).single();
          if (error) {
              console.error("AuthContext: Profile fetch error", error);
              return null;
          }
          return data;
      } catch (e) {
          console.error(e);
          return null;
      }
  };

  useEffect(() => {
    if (isDemoMode) {
      const stored = localStorage.getItem('demo_user_session');
      if (stored) {
          const parsed = JSON.parse(stored);
          handleDemoLogin(parsed.user, parsed.profile);
      } else {
          setLoading(false);
      }
      return;
    }

    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                const userProfile = await fetchProfile(session.user.id);
                setProfile(userProfile);
            }
        } catch (error) {
            console.error("AuthContext: Session check failed", error);
        } finally {
            setLoading(false);
        }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        
        if (session?.user) {
            setUser(session.user);
            if (!profile || profile.id !== session.user.id) {
                const userProfile = await fetchProfile(session.user.id);
                setProfile(userProfile);
            }
        } else {
            setUser(null);
            setProfile(null);
        }
        setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (isDemoMode) {
        handleDemoLogin(undefined, undefined, true);
    } else {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    }
  };

  const signInWithCredentials = async (email: string, pass: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    if (isDemoMode) {
        if (email === 'admin' && pass === 'admin') {
             const adminUser = { id: 'admin1', email: 'admin@microspace.app' };
             const adminProfile: Profile = {
                id: 'admin1', username: 'Lucas Willian', role: 'admin', group_id: 'g1', 
                avatar_url: null, background_url: null, bio: '', followers_count: 999, following_count: 0 
             };
             handleDemoLogin(adminUser, adminProfile, rememberMe);
             return { success: true };
        }
        handleDemoLogin(undefined, undefined, rememberMe);
        return { success: true };
    } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) return { success: false, error: error.message };
        return { success: true };
    }
  };

  const signUp = async (email: string, pass: string, username: string, groupId: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      if (isDemoMode) {
          const newProfile = await Service.createProfile(username, groupId);
          const newUser = { id: newProfile.id, email };
          handleDemoLogin(newUser, newProfile, true);
          return { success: true };
      } else {
          const { data, error } = await supabase.auth.signUp({
              email, 
              password: pass,
              options: { 
                  data: { 
                      full_name: username,
                      group_id: groupId 
                  } 
              } 
          });
          
          if (error) return { success: false, error: error.message };
          
          if (data.user && !data.session) {
              return { success: true, message: 'check_email' };
          }

          return { success: true };
      }
  };

  const signOut = async () => {
    if (isDemoMode) {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('demo_user_session');
    } else {
        await supabase.auth.signOut();
    }
  };

  const resetPassword = async (email: string) => {
      if (isDemoMode) return { success: true };
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
  };

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithCredentials, signUp, signOut, resetPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};