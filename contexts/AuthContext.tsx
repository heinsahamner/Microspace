import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode, Service } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithCredentials: (e: string, p: string, rememberMe?: boolean) => Promise<boolean>;
  signUp: (e: string, p: string, u: string, g: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loginDemoUser = (customUser?: any, customProfile?: any) => {
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
      return true;
  };

  useEffect(() => {
    if (isDemoMode) {
      const stored = localStorage.getItem('demo_user_session');
      if (stored) {
          const parsed = JSON.parse(stored);
          loginDemoUser(parsed.user, parsed.profile);
      } else {
          setLoading(false);
      }
      return;
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*, group:groups(*)').eq('id', session.user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         const { data } = await supabase.from('profiles').select('*, group:groups(*)').eq('id', session.user.id).single();
         setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    if (isDemoMode) {
        loginDemoUser();
        localStorage.setItem('demo_user_session', JSON.stringify({
            user: { id: 'u_demo', email: 'demo@student.com' },
            profile: { id: 'u_demo', username: 'demo_user', role: 'student', group_id: 'g1' }
        }));
    } else {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    }
  };

  const signInWithCredentials = async (email: string, pass: string, rememberMe: boolean = false): Promise<boolean> => {
    if (isDemoMode) {
        if (email === 'admin' && pass === 'admin') {
             const adminUser = { id: 'admin1', email: 'admin@microspace.app' };
             const adminProfile: Profile = {
                id: 'admin1', username: 'Lucas Willian', role: 'admin', group_id: 'g1', 
                avatar_url: null, background_url: null, bio: '', followers_count: 999, following_count: 0 
             };
             if (rememberMe) localStorage.setItem('demo_user_session', JSON.stringify({ user: adminUser, profile: adminProfile }));
             return loginDemoUser(adminUser, adminProfile);
        }
        return loginDemoUser();
    } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        return !error;
    }
  };

  const signUp = async (email: string, pass: string, username: string, groupId: string, rememberMe: boolean = false): Promise<{ success: boolean; message?: string }> => {
      if (isDemoMode) {
          const newProfile = await Service.createProfile(username, groupId);
          const newUser = { id: newProfile.id, email };
          if (rememberMe) localStorage.setItem('demo_user_session', JSON.stringify({ user: newUser, profile: newProfile }));
          loginDemoUser(newUser, newProfile);
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
          
          if (error) return { success: false, message: error.message };
          
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

  const updateProfile = (updates: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithCredentials, signUp, signOut, updateProfile }}>
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
