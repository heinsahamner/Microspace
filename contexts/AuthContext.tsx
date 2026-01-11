import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isDemoMode, MockService } from '../services/supabase';
import { Profile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithCredentials: (u: string, p: string, rememberMe?: boolean) => Promise<boolean>;
  signUp: (username: string, groupId: string, rememberMe?: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loginDemoUser = () => {
      setUser({ id: 'u_demo', email: 'demo@student.com' });
      setProfile({
        id: 'u_demo',
        username: 'demo_user',
        avatar_url: null,
        background_url: null,
        bio: 'Usuário de demonstração',
        followers_count: 0,
        following_count: 0,
        role: 'student',
        group_id: 'g1',
      });
      setLoading(false);
  };

  useEffect(() => {
    if (isDemoMode) {
      const storedUser = localStorage.getItem('demo_user_session');
      if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed.user);
          setProfile(parsed.profile);
      }
      setLoading(false);
      return;
    }

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
         const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
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
            profile: { 
              id: 'u_demo', 
              username: 'demo_user', 
              role: 'student', 
              group_id: 'g1',
              avatar_url: null,
              background_url: null,
              bio: 'Usuário de demonstração',
              followers_count: 0,
              following_count: 0
            }
        }));
    } else {
        await supabase.auth.signInWithOAuth({ provider: 'google' });
    }
  };

  const signInWithCredentials = async (u: string, p: string, rememberMe: boolean = false): Promise<boolean> => {
    // Hardcoded admin para testes
    if (u === 'Lucas Willian' && p === 'cxa@Ayatka#827@19') {
        const adminUser = { id: 'admin1', email: 'lucas@microspace.app' };
        const adminProfile: Profile = {
            id: 'admin1',
            username: 'Lucas Willian',
            avatar_url: null,
            background_url: null,
            bio: 'Criador do Microspace',
            followers_count: 999,
            following_count: 0,
            role: 'admin',
            group_id: 'g1',
        };
        setUser(adminUser);
        setProfile(adminProfile);
        if (isDemoMode && rememberMe) {
            localStorage.setItem('demo_user_session', JSON.stringify({
                user: adminUser,
                profile: adminProfile
            }));
        }
        return true;
    } else if (u && isDemoMode) {
        const mockUser = { id: 'u_demo', email: 'user@demo.com' };
        const mockProfile: Profile = {
            id: 'u_demo',
            username: u,
            avatar_url: null,
            background_url: null,
            bio: 'Usuário de demonstração',
            followers_count: 0,
            following_count: 0,
            role: 'student',
            group_id: 'g1'
        };
        setUser(mockUser);
        setProfile(mockProfile);
        if (rememberMe) {
             localStorage.setItem('demo_user_session', JSON.stringify({
                user: mockUser,
                profile: mockProfile
            }));
        }
        return true;
    }
    return false;
  };

  const signUp = async (username: string, groupId: string, rememberMe: boolean = false): Promise<boolean> => {
      if (isDemoMode) {
          const newProfile = await MockService.createProfile(username, groupId);
          const newUser = { id: newProfile.id, email: `${username}@demo.com` };
          
          setUser(newUser);
          setProfile(newProfile);

          if (rememberMe) {
              localStorage.setItem('demo_user_session', JSON.stringify({
                  user: newUser,
                  profile: newProfile
              }));
          }
          return true;
      }
      return false;
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